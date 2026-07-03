import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

function exists(p: string) { return existsSync(path.join(ROOT, p)); }
function read(p: string) { return JSON.parse(readFileSync(path.join(ROOT, p), "utf-8")); }
function readRaw(p: string) { return readFileSync(path.join(ROOT, p), "utf-8"); }

describe("Phase 1: Monorepo structure", () => {

  describe("Required directories", () => {
    it("api/ exists", () => expect(exists("api")).toBe(true));
    it("party/ exists", () => expect(exists("party")).toBe(true));
    it("lib/ exists", () => expect(exists("lib")).toBe(true));
    it("shared/ exists", () => expect(exists("shared")).toBe(true));
    it("tests/ exists", () => expect(exists("tests")).toBe(true));
  });

  describe("Root config files", () => {
    it("root package.json has unified scripts", () => {
      const pkg = read("package.json");
      expect(pkg.scripts["test"]).toBeDefined();
      expect(pkg.scripts["dev:api"]).toBeDefined();
      expect(pkg.scripts["dev:ws"]).toBeDefined();
      expect(pkg.scripts["build"]).toBeDefined();
    });

    it("vercel.json does NOT proxy to onrender.com", () => {
      const vcj = readRaw("vercel.json");
      expect(vcj).not.toContain("onrender.com");
    });

    it("vercel.json has a cron job configured", () => {
      const vcj = read("vercel.json");
      expect(vcj.crons).toBeDefined();
      expect(vcj.crons.length).toBeGreaterThan(0);
    });

    it("vercel.json has SPA fallback rewrite", () => {
      const vcj = read("vercel.json");
      const hasFallback = vcj.rewrites?.some((r: any) =>
        r.source === "/(.*)" && r.destination === "/index.html"
      );
      expect(hasFallback).toBe(true);
    });

    it("partykit.json exists and references party/chat.ts", () => {
      expect(exists("partykit.json")).toBe(true);
      const pkj = read("partykit.json");
      expect(pkj.main).toMatch(/chat/);
      expect(pkj.parties?.notifications).toBeDefined();
    });
  });

  describe("Dependency audit", () => {
    it("@libsql/client is in dependencies", () => {
      const pkg = read("package.json");
      expect(pkg.dependencies?.["@libsql/client"]).toBeDefined();
    });
    it("@upstash/redis is in dependencies", () => {
      const pkg = read("package.json");
      expect(pkg.dependencies?.["@upstash/redis"]).toBeDefined();
    });
    it("@upstash/ratelimit is in dependencies", () => {
      const pkg = read("package.json");
      expect(pkg.dependencies?.["@upstash/ratelimit"]).toBeDefined();
    });
    it("partysocket is in dependencies", () => {
      const pkg = read("package.json");
      expect(pkg.dependencies?.["partysocket"]).toBeDefined();
    });
    it("vitest is in devDependencies", () => {
      const pkg = read("package.json");
      expect(pkg.devDependencies?.["vitest"]).toBeDefined();
    });
    it("pg is NOT in runtime dependencies", () => {
      const pkg = read("package.json");
      expect(pkg.dependencies?.["pg"]).toBeUndefined();
    });
    it("socket.io is NOT in any dependencies", () => {
      const pkg = read("package.json");
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      expect(allDeps["socket.io"]).toBeUndefined();
      expect(allDeps["socket.io-client"]).toBeUndefined();
    });
    it("connect-pg-simple is NOT in dependencies", () => {
      const pkg = read("package.json");
      expect(pkg.dependencies?.["connect-pg-simple"]).toBeUndefined();
    });
    it("node-cron is NOT in runtime dependencies", () => {
      const pkg = read("package.json");
      expect(pkg.dependencies?.["node-cron"]).toBeUndefined();
    });
    it("express-rate-limit is NOT in dependencies", () => {
      const pkg = read("package.json");
      expect(pkg.dependencies?.["express-rate-limit"]).toBeUndefined();
    });
  });
});
