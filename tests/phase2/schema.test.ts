import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = path.resolve(__dirname, "../..");

function findActiveSchemaFile(): string {
  // Prefer schema.sqlite.ts, fall back to schema.ts
  const sqlite = path.join(ROOT, "shared/schema.sqlite.ts");
  const main = path.join(ROOT, "shared/schema.ts");
  if (existsSync(sqlite)) return sqlite;
  if (existsSync(main)) return main;
  throw new Error("No schema file found at shared/schema.sqlite.ts or shared/schema.ts");
}

describe("Phase 2: SQLite schema correctness", () => {
  const schemaPath = findActiveSchemaFile();
  const content = readFileSync(schemaPath, "utf-8");

  const BANNED_PG_CONSTRUCTS = [
    { pattern: /jsonb\(/, label: "jsonb() — use text({ mode: 'json' }) instead" },
    { pattern: /serial\(/, label: "serial() — use integer({ autoIncrement: true }) instead" },
    { pattern: /pgTable\(/, label: "pgTable() — use sqliteTable() instead" },
    { pattern: /varchar\(/, label: "varchar() — use text() instead" },
    { pattern: /from ["']drizzle-orm\/pg-core["']/, label: "drizzle-orm/pg-core import" },
    { pattern: /\.array\(\)/, label: ".array() — arrays are not SQLite-native; use text({ mode: 'json' })" },
  ];

  for (const { pattern, label } of BANNED_PG_CONSTRUCTS) {
    it(`schema has ZERO occurrences of: ${label}`, () => {
      const matches = content.match(new RegExp(pattern, "g"));
      expect(matches, `Found ${matches?.length} occurrence(s) of ${label}`).toBeNull();
    });
  }

  it("imports from drizzle-orm/sqlite-core", () => {
    expect(content).toContain("drizzle-orm/sqlite-core");
  });

  it("uses sqliteTable for every table definition", () => {
    const tableCount = (content.match(/sqliteTable\(/g) || []).length;
    expect(tableCount).toBeGreaterThan(5); // conservative minimum for this app
  });

  it("all boolean columns use integer({ mode: 'boolean' })", () => {
    // Every column that should be boolean (is_admin, is_verified, is_featured, etc.)
    // must NOT use a raw boolean() call (doesn't exist in sqlite-core)
    expect(content).not.toContain("boolean(");
  });

  it("JSON columns use text({ mode: 'json' })", () => {
    // Presence check — at least some json-mode columns should exist
    expect(content).toContain("mode: \"json\"");
  });

  it("schema compiles cleanly under tsc --noEmit", () => {
    const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
    expect(() =>
      execSync(`${npxCmd} tsc --noEmit --target ES2020 --moduleResolution bundler --skipLibCheck ${schemaPath}`, {
        stdio: "pipe",
        cwd: ROOT,
      })
    ).not.toThrow();
  }, 20000);

  it("expected tables are present: users, posts, messages, notifications, session", () => {
    for (const table of ["users", "posts", "messages", "notifications", "session"]) {
      expect(content).toContain(`"${table}"`);
    }
  });
});
