import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";

const API_DIR = path.resolve(__dirname, "../../api");

function apiExists(p: string) {
  return existsSync(path.join(API_DIR, p));
}

describe("Phase 4: Vercel API functions — file existence + structure", () => {

  const REQUIRED_ROUTES = [
    "health.ts",
    "csrf-token.ts",
    "me.ts",
    "logout.ts",
    "register.ts",
    "login.ts",
    "auth/google.ts",
    "auth/google/callback.ts",
    "posts/index.ts",
    "posts/[id].ts",
    "posts/[id]/upvote.ts",
    "posts/[id]/downvote.ts",
    "users/[id].ts",
    "users/profile.ts",
    "connection-requests/index.ts",
    "connection-requests/[id].ts",
    "chats/index.ts",
    "chats/[id]/messages.ts",
    "notifications/index.ts",
    "notifications/read.ts",
    "analytics.ts",
    "events/[id]/registrations.ts",
    "events/[id]/register.ts",
    "admin/[...path].ts",
    "internal/daily-cleanup.ts",
  ];

  for (const route of REQUIRED_ROUTES) {
    it(`api/${route} exists`, () => {
      expect(apiExists(route)).toBe(true);
    });
  }

  it("every API function exports a default handler function", () => {
    const files = readdirSync(API_DIR, { recursive: true })
      .filter((f) => String(f).endsWith(".ts") && !String(f).startsWith("_"));
    const withoutDefault: string[] = [];
    for (const f of files) {
      const src = readFileSync(path.join(API_DIR, String(f)), "utf-8");
      if (!src.includes("export default")) {
        withoutDefault.push(String(f));
      }
    }
    expect(withoutDefault, `Functions without default export: ${withoutDefault.join(", ")}`).toHaveLength(0);
  });

  it("no API function imports from socket.io or socket.io-server", () => {
    const files = readdirSync(API_DIR, { recursive: true })
      .filter((f) => String(f).endsWith(".ts"));
    for (const f of files) {
      const src = readFileSync(path.join(API_DIR, String(f)), "utf-8");
      expect(src, `${f} imports socket.io`).not.toContain("socket.io");
    }
  });

  it("no API function uses express-rate-limit (must use Upstash)", () => {
    const files = readdirSync(API_DIR, { recursive: true })
      .filter((f) => String(f).endsWith(".ts"));
    for (const f of files) {
      const src = readFileSync(path.join(API_DIR, String(f)), "utf-8");
      expect(src, `${f} uses express-rate-limit`).not.toContain("express-rate-limit");
    }
  });

  it("no API function references node-cron", () => {
    const files = readdirSync(API_DIR, { recursive: true })
      .filter((f) => String(f).endsWith(".ts"));
    for (const f of files) {
      const src = readFileSync(path.join(API_DIR, String(f)), "utf-8");
      expect(src, `${f} references node-cron`).not.toContain("node-cron");
    }
  });

  it("api/internal/daily-cleanup.ts is protected by CRON_SECRET check", () => {
    const src = readFileSync(path.join(API_DIR, "internal/daily-cleanup.ts"), "utf-8");
    expect(src).toContain("CRON_SECRET");
    expect(src).toContain("401"); // must reject unauthorized
  });
});
