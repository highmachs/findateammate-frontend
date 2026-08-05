import type { VercelRequest, VercelResponse } from "@vercel/node";
import session from "express-session";
import { sessionStore } from "./session";
import { doubleCsrf } from "csrf-csrf";
import cookieParser from "cookie-parser";
import { storage } from "./storage";

// ----- Session Middleware -----
const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

export const sessionMiddleware = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    sameSite: "lax",
  },
});

// ----- CSRF -----
const {
  generateToken: _generateCsrfToken,
  doubleCsrfProtection: _doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || "dev-csrf-secret-change-in-prod",
  cookieName: "x-csrf-token",
  cookieOptions: {
    sameSite: "lax",
    path: "/",
    secure: isProduction,
    httpOnly: false,
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getTokenFromRequest: (req: any) => req.headers["x-csrf-token"],
  getSessionIdentifier: (req: any) => req.sessionID || "anonymous",
});

export const generateCsrfToken = _generateCsrfToken;
export const doubleCsrfProtection = _doubleCsrfProtection;

// ----- CORS Headers -----
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://findateammate.online",
  "https://findateammate.info",
  ...(isProduction ? [] : ["http://localhost:5000", "http://localhost:5173", "http://localhost:3000"]),
].filter(Boolean) as string[];

export function corsMiddleware(req: any, res: any, next: any) {
  const origin = req.headers.origin as string | undefined;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-csrf-token, Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
}

// ----- Load user from session (runs on every request) -----
export async function loadUserMiddleware(req: any, res: any, next: any) {
  if (req.user) return next();

  const userId = req.session?.userId || req.session?.passport?.user;
  if (!userId) return next();

  try {
    const userPromise = storage.getUser(userId);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("loadUser Turso Query Timed Out")), 3000));
    const user = await Promise.race([userPromise, timeoutPromise]) as any;
    if (user) {
      const { password, ...safeUser } = user;
      req.user = safeUser;
      // Fire-and-forget: updateLastActive now uses waitUntil internally to prevent blocking the response
      storage.updateLastActive(user.id).catch(() => { });
    }
  } catch {
    // silently continue
  }
  next();
}

// ----- Auth guards -----
export function requireAuth(req: any, res: VercelResponse): boolean {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return false;
  }
  if (req.user.isBanned && !req.user.isAdmin) {
    res.status(403).json({ message: "You have been banned", code: "USER_BANNED" });
    return false;
  }
  return true;
}

export function requireAdmin(req: any, res: VercelResponse): boolean {
  if (!requireAuth(req, res)) return false;
  if (!req.user.isAdmin) {
    res.status(403).json({ message: "Forbidden: Admin access only" });
    return false;
  }
  return true;
}

export function requireOrganiser(req: any, res: VercelResponse): boolean {
  if (!requireAuth(req, res)) return false;
  if (!req.user.isOrganiser && !req.user.isAdmin) {
    res.status(403).json({ message: "Forbidden: Organiser access only" });
    return false;
  }
  return true;
}

// ----- Convenience: bootstrap all middleware for an API handler -----
export function csrfMiddleware(req: any, res: any, next: any) {
  const isInternal = req.url?.startsWith("/api/internal");
  const isAnalytics = req.url?.startsWith("/api/analytics"); // sendBeacon cannot send CSRF headers
  const hasPartyKitSecret = !!req.headers["x-partykit-secret"];

  if (req.url && req.url.startsWith("/api") && !isInternal && !isAnalytics && !hasPartyKitSecret) {
    _doubleCsrfProtection(req, res, (err: any) => {
      if (err) {
        if (err.code === 'EBADCSRFTOKEN') {
          return res.status(403).json({ message: "Invalid CSRF Token" });
        }
        console.error("CSRF Middleware error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      next();
    });
  } else {
    next();
  }
}
