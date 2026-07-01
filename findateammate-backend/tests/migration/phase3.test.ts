import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";
import { createClient } from "@libsql/client";
import "dotenv/config";

describe("Phase 3: Turso connection layer", () => {
  beforeAll(() => {
    execSync("npx drizzle-kit push --config drizzle.config.ts", { stdio: "pipe" });
  });

  it("db.ts module imports without throwing", async () => {
    await expect(import("../../backend/db")).resolves.toBeTruthy();
  });

  it("every expected table exists after push", async () => {
    const client = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
    const res = await client.execute("select name from sqlite_master where type='table'");
    const names = res.rows.map(r => r.name);
    for (const expected of ["users", "posts", "connection_requests", "event_registrations", "messages", "notifications", "session", "system_settings", "analytics", "event_votes", "post_interactions", "user_searches", "user_preferences", "audit_logs", "feedback", "reports"]) {
      expect(names).toContain(expected);
    }
  });

  it("boolean and json columns have correct SQLite affinity", async () => {
    const client = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
    const res = await client.execute("pragma table_info(users)");
    const isAdmin = res.rows.find(r => r.name === "is_admin");
    const skills = res.rows.find(r => r.name === "skills");
    expect(isAdmin?.type).toBe("INTEGER");
    expect(skills?.type).toBe("TEXT");
  });
});
