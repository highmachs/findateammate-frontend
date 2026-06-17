import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

function getSSLConfig() {
  const url = process.env.DATABASE_URL || "";
  if (url.includes("render.com")) {
    return { rejectUnauthorized: false };
  }
  if (url.includes("rds.amazonaws.com")) {
    const certPath = path.join(process.cwd(), "certs", "global-bundle.pem");
    if (fs.existsSync(certPath)) {
      return {
        rejectUnauthorized: true,
        ca: fs.readFileSync(certPath).toString(),
      };
    }
    return { rejectUnauthorized: false };
  }
  return undefined;
}

function readJournal(migrationsDir) {
  const journalPath = path.join(migrationsDir, "meta", "_journal.json");
  const raw = fs.readFileSync(journalPath, "utf8");
  return JSON.parse(raw);
}

function readMigrationSql(migrationsDir, tag) {
  const sqlPath = path.join(migrationsDir, `${tag}.sql`);
  return fs.readFileSync(sqlPath, "utf8");
}

function normalizeSql(sql) {
  return sql.replace(/\r\n/g, "\n").trim();
}

async function tableExists(pool, tableName) {
  const result = await pool.query("select to_regclass($1) as regclass", [`public.${tableName}`]);
  return Boolean(result.rows[0]?.regclass);
}

async function indexExists(pool, indexName) {
  const result = await pool.query("select to_regclass($1) as regclass", [`public.${indexName}`]);
  return Boolean(result.rows[0]?.regclass);
}

async function columnExists(pool, tableName, columnName) {
  const result = await pool.query(
    `
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
        and column_name = $2
      limit 1
    `,
    [tableName, columnName],
  );
  return result.rowCount > 0;
}

async function constraintExists(pool, constraintName) {
  const result = await pool.query(
    `
      select 1
      from pg_constraint
      where conname = $1
      limit 1
    `,
    [constraintName],
  );
  return result.rowCount > 0;
}

async function isColumnNullable(pool, tableName, columnName) {
  const result = await pool.query(
    `
      select is_nullable
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
        and column_name = $2
      limit 1
    `,
    [tableName, columnName],
  );

  if (result.rowCount === 0) return null;
  return result.rows[0].is_nullable === "YES";
}

async function hasColumnDefault(pool, tableName, columnName) {
  const result = await pool.query(
    `
      select column_default
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
        and column_name = $2
      limit 1
    `,
    [tableName, columnName],
  );

  if (result.rowCount === 0) return null;
  return result.rows[0].column_default !== null;
}

async function policyExists(pool, tableName, policyName) {
  const result = await pool.query(
    `
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = $1
        and policyname = $2
      limit 1
    `,
    [tableName, policyName],
  );
  return result.rowCount > 0;
}

async function statementAlreadyApplied(pool, statement) {
  const stmt = statement
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/--.*$/g, "").trim())
    .filter((line) => line.length > 0)
    .join(" ")
    .trim();

  if (!stmt) return true;

  let match = null;

  // Handle DO $$ blocks used for conditional constraint creation.
  if (/^DO\s+\$\$/i.test(stmt)) {
    match = stmt.match(/conname\s*=\s*'([a-zA-Z0-9_]+)'/i);
    if (match) return constraintExists(pool, match[1]);
  }

  match = stmt.match(/^CREATE TABLE(?: IF NOT EXISTS)?\s+"?([a-zA-Z0-9_]+)"?/i);
  if (match) return tableExists(pool, match[1]);

  match = stmt.match(/^DROP TABLE(?: IF EXISTS)?\s+"?([a-zA-Z0-9_]+)"?/i);
  if (match) return !(await tableExists(pool, match[1]));

  match = stmt.match(/^CREATE(?: UNIQUE)? INDEX(?: IF NOT EXISTS)?\s+"?([a-zA-Z0-9_]+)"?/i);
  if (match) return indexExists(pool, match[1]);

  match = stmt.match(/^DROP INDEX(?: IF EXISTS)?\s+"?([a-zA-Z0-9_]+)"?/i);
  if (match) {
    // Final-state check cannot always infer historical DROP/CREATE ordering.
    // Treat as applied when index is either absent (drop effective) or present (possibly recreated later).
    return true;
  }

  match = stmt.match(/^ALTER TABLE(?: IF EXISTS)?\s+"?([a-zA-Z0-9_]+)"?\s+ADD COLUMN(?: IF NOT EXISTS)?\s+"?([a-zA-Z0-9_]+)"?/i);
  if (match) return columnExists(pool, match[1], match[2]);

  match = stmt.match(/^ALTER TABLE(?: IF EXISTS)?\s+"?([a-zA-Z0-9_]+)"?\s+DROP COLUMN(?: IF EXISTS)?\s+"?([a-zA-Z0-9_]+)"?/i);
  if (match) return !(await columnExists(pool, match[1], match[2]));

  match = stmt.match(/^ALTER TABLE(?: IF EXISTS)?\s+"?([a-zA-Z0-9_]+)"?\s+RENAME COLUMN\s+"?([a-zA-Z0-9_]+)"?\s+TO\s+"?([a-zA-Z0-9_]+)"?/i);
  if (match) {
    const oldExists = await columnExists(pool, match[1], match[2]);
    const newExists = await columnExists(pool, match[1], match[3]);
    return !oldExists && newExists;
  }

  match = stmt.match(/^ALTER TABLE(?: IF EXISTS)?\s+"?([a-zA-Z0-9_]+)"?\s+ADD CONSTRAINT\s+"?([a-zA-Z0-9_]+)"?/i);
  if (match) return constraintExists(pool, match[2]);

  match = stmt.match(/^ALTER TABLE\s+"?([a-zA-Z0-9_]+)"?\s+ALTER COLUMN\s+"?([a-zA-Z0-9_]+)"?\s+DROP NOT NULL/i);
  if (match) {
    const nullable = await isColumnNullable(pool, match[1], match[2]);
    return nullable === true;
  }

  match = stmt.match(/^ALTER TABLE\s+"?([a-zA-Z0-9_]+)"?\s+ALTER COLUMN\s+"?([a-zA-Z0-9_]+)"?\s+SET DEFAULT/i);
  if (match) {
    const hasDefault = await hasColumnDefault(pool, match[1], match[2]);
    return hasDefault === true;
  }

  match = stmt.match(/^ALTER TABLE(?: IF EXISTS)?\s+"?([a-zA-Z0-9_]+)"?\s+DISABLE ROW LEVEL SECURITY/i);
  if (match) {
    // Transitional safety operation; treat as compatible in final-state baselining.
    return true;
  }

  match = stmt.match(/^CREATE POLICY\s+"?([a-zA-Z0-9_]+)"?\s+ON\s+"?([a-zA-Z0-9_]+)"?/i);
  if (match) {
    return policyExists(pool, match[2], match[1]);
  }

  if (/^(UPDATE|INSERT|DELETE)\b/i.test(stmt)) {
    return true;
  }

  return null;
}

async function migration0018Applied(pool) {
  const checks = await Promise.all([
    tableExists(pool, "audit_logs"),
    tableExists(pool, "event_votes"),
    tableExists(pool, "feedback"),
    tableExists(pool, "reports"),
    tableExists(pool, "system_settings"),
    columnExists(pool, "users", "google_id"),
    columnExists(pool, "users", "auth_provider"),
    columnExists(pool, "users", "is_verified"),
    columnExists(pool, "users", "email_verified_at"),
    columnExists(pool, "posts", "event_date"),
    columnExists(pool, "connection_requests", "updated_at"),
    indexExists(pool, "requests_unique_idx"),
  ]);

  return checks.every(Boolean);
}

async function migrationAlreadyApplied(pool, sqlText, tag) {
  // 0018 was a large transition migration with objects altered by later migrations.
  // Use a stable compatibility check instead of strict statement-by-statement end-state checks.
  if (tag === "0018_bored_junta") {
    return migration0018Applied(pool);
  }

  const chunks = sqlText.includes("--> statement-breakpoint")
    ? sqlText.split("--> statement-breakpoint")
    : sqlText.split(";");

  const statements = chunks
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    const applied = await statementAlreadyApplied(pool, statement);
    if (applied !== true) {
      return false;
    }
  }
  return true;
}

async function ensureMigrationsTable(pool) {
  await pool.query("CREATE SCHEMA IF NOT EXISTS drizzle");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id serial primary key,
      hash text not null,
      created_at bigint
    )
  `);
}

async function main() {
  const migrationsDir = path.join(process.cwd(), "migrations");
  const journal = readJournal(migrationsDir);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: getSSLConfig(),
    max: 1,
  });

  try {
    await ensureMigrationsTable(pool);

    const existing = await pool.query("select created_at from drizzle.__drizzle_migrations");
    const existingCreatedAt = new Set(
      existing.rows.map((r) => Number(r.created_at)).filter((n) => Number.isFinite(n)),
    );

    let inserted = 0;

    for (const entry of journal.entries) {
      if (existingCreatedAt.has(entry.when)) {
        continue;
      }

      const sqlText = normalizeSql(readMigrationSql(migrationsDir, entry.tag));
      const hash = crypto.createHash("sha256").update(sqlText).digest("hex");

      const canBaseline = await migrationAlreadyApplied(pool, sqlText, entry.tag);
      if (!canBaseline) {
        console.log(`[drift-repair] Skipped ${entry.tag} (not fully in applied end-state)`);
        continue;
      }

      await pool.query(
        "insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)",
        [hash, entry.when],
      );
      inserted += 1;
      console.log(`[drift-repair] Marked ${entry.tag} as applied`);
    }

    if (inserted === 0) {
      console.log("[drift-repair] No migration history repair needed");
    } else {
      console.log(`[drift-repair] Repaired ${inserted} migration history entries`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[drift-repair] Failed:", error);
  process.exit(1);
});
