import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";

describe("Phase 2: schema.sqlite.ts structural correctness", () => {
  const pgSchema = readFileSync("shared/schema.ts", "utf-8");
  const sqliteSchema = readFileSync("shared/schema.sqlite.ts", "utf-8");

  it("contains zero leftover pg-core-only constructs", () => {
    for (const banned of ["jsonb(", "serial(", "pgTable(", "varchar(", "from \"drizzle-orm/pg-core\""]) {
      expect(sqliteSchema.includes(banned)).toBe(false);
    }
  });

  it("every table name in the pg schema also exists in the sqlite schema", () => {
    const tableNames = [...pgSchema.matchAll(/pgTable\("(\w+)"/g)].map(m => m[1]);
    expect(tableNames.length).toBeGreaterThan(0); // sanity check the regex itself matched something
    for (const name of tableNames) {
      expect(sqliteSchema.includes(`sqliteTable("${name}"`)).toBe(true);
    }
  });

  it("compiles cleanly under tsc", async () => {
    const { execSync } = await import("child_process");
    const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
    expect(() => execSync(`${npxCmd} tsc --noEmit --strict --esModuleInterop --skipLibCheck shared/schema.sqlite.ts`, { stdio: "pipe" })).not.toThrow();
  }, 20000);
});
