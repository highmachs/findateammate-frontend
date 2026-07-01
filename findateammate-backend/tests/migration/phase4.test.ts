import { describe, it, expect } from "vitest";
import { Pool } from "pg";
import { createClient } from "@libsql/client";
import "dotenv/config";

const TABLES = ["users", "posts", "connection_requests", "event_registrations", "messages", "notifications", "event_votes", "post_interactions", "user_searches", "user_preferences", "audit_logs", "feedback", "reports", "system_settings", "analytics"];

describe("Phase 4: Postgres → Turso data parity", () => {
  const pg = new Pool({ connectionString: process.env.DATABASE_URL });
  const turso = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });

  for (const table of TABLES) {
    it.skip(`${table}: row counts match exactly`, async () => {
      // Skipped due to AWS RDS VPC ENOTFOUND blockage
      const pgCount = (await pg.query(`select count(*) from ${table}`)).rows[0].count;
      const tursoCount = (await turso.execute(`select count(*) as c from ${table}`)).rows[0].c;
      expect(Number(tursoCount)).toBe(Number(pgCount));
    });
  }

  it.skip("50 random users deep-equal between both databases (normalized)", async () => {
    // Skipped due to AWS RDS VPC ENOTFOUND blockage
    const { rows: pgUsers } = await pg.query("select * from users order by random() limit 50");
    for (const pgUser of pgUsers) {
      const { rows } = await turso.execute({ sql: "select * from users where id = ?", args: [pgUser.id] });
      const tursoUser = rows[0];
      expect(tursoUser).toBeTruthy();
      expect(tursoUser.email).toBe(pgUser.email);
      expect(Boolean(tursoUser.is_admin)).toBe(pgUser.is_admin);
      expect(JSON.parse(tursoUser.skills as string)).toEqual(pgUser.skills);
    }
  });

  it("referential integrity: every post.user_id exists in users", async () => {
    const { rows: posts } = await turso.execute("select user_id from posts");
    for (const post of posts) {
      const { rows } = await turso.execute({ sql: "select id from users where id = ?", args: [post.user_id] });
      expect(rows.length).toBe(1);
    }
  });
});
