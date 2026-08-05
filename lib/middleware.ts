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

export function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
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
    return true; // signal: response already sent
  }
  return false;
}

// ----- Run Express middleware in Vercel function -----
export function runMiddleware(req: any, res: any, fn: Function): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      resolve();
    });
  });
}

// ----- Load user from session (runs on every request) -----
export async function loadUser(req: any): Promise<void> {
  if (req.user) return;

  const userId = req.session?.userId || req.session?.passport?.user;
  if (!userId) return;

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
export async function bootstrap(req: any, res: any): Promise<boolean> {
  if (!res.cookie) {
    res.cookie = (name: string, val: string, opts?: any) => {
      const str = `${name}=${val}; Path=/` + (opts?.httpOnly ? "; HttpOnly" : "");
      res.setHeader("Set-Cookie", str);
    };
  }

  try {
    // CORS
    if (setCorsHeaders(req, res)) return false; // preflight handled

    // Cookie parser
    console.log("Cookieparser----")
    await runMiddleware(req, res, cookieParser());

    // Session
    console.log("sessionMiddleware-----")
    await runMiddleware(req, res, sessionMiddleware);

    // Load user from session
    await loadUser(req);

    // CSRF Protection
    const isInternal = req.url?.startsWith("/api/internal");
    const isAnalytics = req.url?.startsWith("/api/analytics"); // sendBeacon cannot send CSRF headers
    const hasPartyKitSecret = !!req.headers["x-partykit-secret"];

    console.log("before doubleCsrfProtection")
    if (req.url && req.url.startsWith("/api") && !isInternal && !isAnalytics && !hasPartyKitSecret) {
      await runMiddleware(req, res, _doubleCsrfProtection);
      console.log("inside doubleCsrfProtection")
    }
    console.log("after doubleCsrfProtection")

    return true; // ready to proceed
  } catch (error: any) {
    // Gracefully handle middleware errors (e.g. CSRF invalid) instead of crashing Vercel function
    if (error.code === 'EBADCSRFTOKEN') {
      res.status(403).json({ message: "Invalid CSRF Token" });
    } else {
      console.error("Middleware error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
    return false;
  }
}
