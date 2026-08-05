import { Store } from "express-session";
import { db } from "./db";
import { session as sessionTable } from "../shared/schema.sqlite";
import { eq, lt } from "drizzle-orm";

/**
 * Helper to prevent Turso from hanging the global middleware chain
 */

console.log('session starts-----')
async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  console.log('session starts inside withTimeout-----')
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  console.log('inside withTimeout before try')
  try {
    console.log('inside withTimeout try')
    return await Promise.race([promise, timeout]);
  } finally {
    console.log('inside withTimeout finally')
    clearTimeout(timer!);
  }
}

/**
 * TursoSessionStore for serverless environments.
 * Stores sessions in Turso (external DB) — no in-memory state.
 * Unlike the original, this does NOT use setInterval for pruning;
 * pruning is handled by a Vercel Cron job instead.
 */
export class TursoSessionStore extends Store {
  private cache = new Map<string, { sess: any; expire: number }>();
  async get(sid: string, cb: (err: any, session?: any) => void) {
    console.log('inside get-----------------')
    try {
      console.log('inside try')
      const cached = this.cache.get(sid);
      if (cached && cached.expire > Date.now()) {
        console.log('inside cache hit')
        return cb(null, cached.sess);
      }

      console.log('before await withTimeout get')
      const [row] = await withTimeout(
        db.select().from(sessionTable).where(eq(sessionTable.sid, sid)),
        5000,
        "TursoSessionStore.get"
      );
      console.log('after await withTimeout get')
      if (!row || row.expire.getTime() < Date.now()) return cb(null, undefined);

      // Update cache with 15s TTL
      this.cache.set(sid, { sess: row.sess, expire: Date.now() + 15000 });
      console.log('after cache set')
      cb(null, row.sess as any);
    } catch (err) {
      console.error("TursoSessionStore.get error:", err);
      // Fail open: treat as session miss instead of throwing and crashing the request
      cb(null, undefined);
    }
  }

  async set(sid: string, sess: any, cb?: (err?: any) => void) {
    console.log('inside set-----------------')
    try {
      this.cache.delete(sid); // Invalidate cache
      const expire = new Date(sess.cookie?.expires ?? Date.now() + 3 * 24 * 60 * 60 * 1000);
      console.log('before await withTimeout set')
      await withTimeout(
        db.insert(sessionTable).values({ sid, sess, expire })
          .onConflictDoUpdate({ target: sessionTable.sid, set: { sess, expire } }),
        5000,
        "TursoSessionStore.set"
      );
      console.log('after await withTimeout set')
      cb?.();
    } catch (err) {
      console.error("TursoSessionStore.set error:", err);
      cb?.(err);
    }
  }

  async destroy(sid: string, cb?: (err?: any) => void) {
    try {
      this.cache.delete(sid); // Invalidate cache
      console.log('before await withTimeout destroy')
      await withTimeout(
        db.delete(sessionTable).where(eq(sessionTable.sid, sid)),
        5000,
        "TursoSessionStore.destroy"
      );
      console.log('after await withTimeout destroy')
      cb?.();
    } catch (err) {
      console.error("TursoSessionStore.destroy error:", err);
      cb?.(err);
    }
  }

  async touch(sid: string, sess: any, cb?: (err?: any) => void) {
    try {
      console.log('inside touch-----------------')
      const expire = new Date(sess.cookie?.expires ?? Date.now() + 3 * 24 * 60 * 60 * 1000);

      // Update cache
      this.cache.set(sid, { sess, expire: Date.now() + 15000 });

      // Check if DB write is necessary: skip if expire is more than 6 hours away
      const msUntilExpire = expire.getTime() - Date.now();
      const sixHoursMs = 6 * 60 * 60 * 1000;
      if (msUntilExpire > sixHoursMs) {
        return cb?.();
      }
      console.log('before await withTimeout touch')
      await withTimeout(
        db.update(sessionTable).set({ expire }).where(eq(sessionTable.sid, sid)),
        2000,
        "TursoSessionStore.touch"
      );
      console.log('after await withTimeout touch')
      cb?.();
    } catch (err) {
      console.error("TursoSessionStore.touch error:", err);
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
