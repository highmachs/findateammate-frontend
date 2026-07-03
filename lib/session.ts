import { Store } from "express-session";
import { db } from "./db";
import { session as sessionTable } from "../shared/schema.sqlite";
import { eq, lt } from "drizzle-orm";

/**
 * TursoSessionStore for serverless environments.
 * Stores sessions in Turso (external DB) — no in-memory state.
 * Unlike the original, this does NOT use setInterval for pruning;
 * pruning is handled by a Vercel Cron job instead.
 */
export class TursoSessionStore extends Store {
  async get(sid: string, cb: (err: any, session?: any) => void) {
    try {
      const [row] = await db.select().from(sessionTable).where(eq(sessionTable.sid, sid));
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

  /** Called by the daily cron job, NOT by setInterval. */
  async prune() {
    const now = new Date();
    await db.delete(sessionTable).where(lt(sessionTable.expire, now));
  }
}

export const sessionStore = new TursoSessionStore();
