import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PgStore = connectPg(session);

// SECURITY FIX: Enforce SESSION_SECRET in production
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("CRITICAL: SESSION_SECRET environment variable must be set in production");
}

export const sessionStore = new PgStore({
    pool,
    tableName: 'session',
    createTableIfMissing: true
});

export const sessionMiddleware = session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    proxy: true, // REQUIRED for Render/Vercel proxies to allow 'secure' cookies
    cookie: {
        secure: process.env.NODE_ENV === "production" || process.env.RENDER === "true",
        httpOnly: true,
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
        // Cross-origin: Vercel frontend + Render backend requires 'none' in production
        sameSite: (process.env.NODE_ENV === "production" || process.env.RENDER === "true") ? "none" : "lax"
    },
});
