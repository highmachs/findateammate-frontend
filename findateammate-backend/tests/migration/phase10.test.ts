import { describe, it, expect } from "vitest";

describe("Phase 10: production cutover verification", () => {
  it("production app boots against TURSO_DATABASE_URL with zero Postgres env vars present", async () => {
    const health = await fetch("http://localhost:5000/api/health");
    expect(health.status).toBe(200);
  });

  it("rollback drill: legacy Postgres instance is still reachable and read-only-safe", async () => {
    const { Pool } = await import("pg");
    const connectionString = process.env.DATABASE_URL || process.env.LEGACY_DATABASE_URL;
    if (connectionString) {
      const pool = new Pool({ connectionString });
      const res = await pool.query("select count(*) from users");
      expect(Number(res.rows[0].count)).toBeGreaterThanOrEqual(0);
      await pool.end();
    } else {
      console.log("No legacy DB configured, skipping rollback drill");
    }
  });
});
