import session, { Store } from "express-session";
import { db } from "./db";
import { session as sessionTable } from "../shared/schema.sqlite";
import { eq, lt } from "drizzle-orm";

export class TursoSessionStore extends Store {
  async get(sid: string, cb: (err: any, session?: any) => void) {
    try {
      const [row] = await db.select().from(sessionTable).where(eq(sessionTable.sid, sid));
      // In SQLite/Turso timestamp mode, expire is a Date
      if (!row || row.expire.getTime() < Date.now()) return cb(null, undefined);
      cb(null, row.sess as any);
    } catch (err) {
      cb(err);
    }
  }

  async set(sid: string, sess: any, cb?: (err?: any) => void) {
    try {
      const expire = new Date(sess.cookie?.expires ?? Date.now() + 3 * 24 * 60 * 60 * 1000);
      
      await db.insert(sessionTable).values({ sid, sess, expire })
        .onConflictDoUpdate({ target: sessionTable.sid, set: { sess, expire } });
      cb?.();
    } catch (err) {
      cb?.(err);
    }
  }

  async destroy(sid: string, cb?: (err?: any) => void) {
    try {
      await db.delete(sessionTable).where(eq(sessionTable.sid, sid));
      cb?.();
    } catch (err) {
      cb?.(err);
    }
  }

  async touch(sid: string, sess: any, cb?: (err?: any) => void) {
    try {
      const expire = new Date(sess.cookie?.expires ?? Date.now() + 3 * 24 * 60 * 60 * 1000);
      
      await db.update(sessionTable).set({ expire }).where(eq(sessionTable.sid, sid));
      cb?.();
    } catch (err) {
      cb?.(err);
    }
  }

  async prune() {
    const now = new Date();
    await db.delete(sessionTable).where(lt(sessionTable.expire, now));
  }
}

// SECURITY FIX: Enforce SESSION_SECRET in production
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("CRITICAL: SESSION_SECRET environment variable must be set in production");
}

export const sessionStore = new TursoSessionStore();

// Periodically prune expired sessions every hour
setInterval(() => {
  sessionStore.prune().catch(err => console.error("Error pruning sessions:", err));
}, 60 * 60 * 1000);

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
