import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, readFileSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const lib = (f: string) => path.join(ROOT, "lib", f);
const readLib = (f: string) => readFileSync(lib(f), "utf-8");

describe("Phase 3: lib/ module contracts", () => {

  describe("lib/db.ts", () => {
    it("file exists", () => expect(existsSync(lib("db.ts"))).toBe(true));

    it("uses @libsql/client and drizzle-orm/libsql", () => {
      const src = readLib("db.ts");
      expect(src).toContain("@libsql/client");
      expect(src).toContain("drizzle-orm/libsql");
    });

    it("has ZERO references to pg, Pool, or node-postgres", () => {
      const src = readLib("db.ts");
      expect(src).not.toContain("from \"pg\"");
      expect(src).not.toContain("new Pool(");
      expect(src).not.toContain("node-postgres");
    });

    it("has ZERO setInterval or process.on signal handlers", () => {
      const src = readLib("db.ts");
      expect(src).not.toContain("setInterval(");
      expect(src).not.toContain("process.on(\"SIGTERM\"");
      expect(src).not.toContain("process.on(\"SIGINT\"");
    });

    it("exports db and tursoClient", () => {
      const src = readLib("db.ts");
      expect(src).toContain("export const db");
      expect(src).toContain("export const tursoClient");
    });

    it("connects to Turso successfully at runtime", async () => {
      const { tursoClient } = await import("@lib/db");
      const res = await tursoClient.execute("select 1 as ping");
      expect(res.rows[0].ping).toBe(1);
    });
  });

  describe("lib/cache.ts", () => {
    it("file exists", () => expect(existsSync(lib("cache.ts"))).toBe(true));

    it("uses @upstash/redis NOT in-memory Map", () => {
      const src = readLib("cache.ts");
      expect(src).toContain("@upstash/redis");
      expect(src).not.toContain("new Map<");
      expect(src).not.toContain("class MemoryCache");
    });

    it("exports a redis client", () => {
      const src = readLib("cache.ts");
      expect(src).toContain("export const redis");
    });

    it("can set and get a value at runtime", async () => {
      const { redis } = await import("@lib/cache");
      await redis.set("test:ping", "pong", { ex: 10 });
      const val = await redis.get("test:ping");
      expect(val).toBe("pong");
    });
  });

  describe("lib/ratelimit.ts", () => {
    it("file exists", () => expect(existsSync(lib("ratelimit.ts"))).toBe(true));

    it("uses @upstash/ratelimit NOT express-rate-limit", () => {
      const src = readLib("ratelimit.ts");
      expect(src).toContain("@upstash/ratelimit");
      expect(src).not.toContain("express-rate-limit");
    });

    it("exports at least one named limiter (e.g. voteLimiter, authLimiter)", () => {
      const src = readLib("ratelimit.ts");
      expect(src).toMatch(/export const \w+Limiter/);
    });
  });

  describe("lib/session.ts", () => {
    it("file exists", () => expect(existsSync(lib("session.ts"))).toBe(true));

    it("has ZERO references to connect-pg-simple or pg", () => {
      const src = readLib("session.ts");
      expect(src).not.toContain("connect-pg-simple");
      expect(src).not.toContain("from \"pg\"");
    });

    it("exports a TursoSessionStore class extending Store", () => {
      const src = readLib("session.ts");
      expect(src).toContain("TursoSessionStore");
      expect(src).toContain("extends Store");
    });

    it("implements all 4 required Store methods: get, set, destroy, touch", () => {
      const src = readLib("session.ts");
      for (const method of ["async get(", "async set(", "async destroy(", "async touch("]) {
        expect(src, `Missing Store method: ${method}`).toContain(method);
      }
    });

    it("has NO setInterval for session pruning (must be event-driven or on-write)", () => {
      const src = readLib("session.ts");
      expect(src).not.toContain("setInterval(");
    });
  });
});
