import { createClient } from "@libsql/client";
import { describe, it, expect } from "vitest";
import "dotenv/config";

describe("Phase 1: Turso connectivity", () => {
  it("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are set", () => {
    expect(process.env.TURSO_DATABASE_URL).toBeTruthy();
    expect(process.env.TURSO_AUTH_TOKEN).toBeTruthy();
  });

  it("can open a client and run a trivial query", async () => {
    const client = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
    const res = await client.execute("select 1 as one");
    expect(res.rows[0].one).toBe(1);
  });

  it.skip("the legacy DATABASE_URL (Postgres) is still untouched and reachable", async () => {
    // Skipped due to AWS RDS VPC ENOTFOUND blockage on local machine
    // Reuse the existing pg pool import here — do not delete this test until Phase 10 cutover is complete.
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const res = await pool.query("select 1");
    expect(res.rows[0]).toBeTruthy();
    await pool.end();
  });
});
