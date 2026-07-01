import { Client } from "pg";
import { createClient } from "@libsql/client";
import "dotenv/config";

const TABLES = [
  "users",
  "system_settings",
  "session",
  "posts",
  "connection_requests",
  "event_registrations",
  "event_votes",
  "messages",
  "notifications",
  "post_interactions",
  "reports",
  "user_preferences",
  "user_searches",
  "analytics",
  "audit_logs",
  "feedback"
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required (Postgres)");
  if (!process.env.TURSO_DATABASE_URL || (!process.env.TURSO_AUTH_TOKEN && process.env.TURSO_DATABASE_URL !== "file:./local.db")) {
    throw new Error("TURSO credentials missing");
  }

  const pgClient = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pgClient.connect();

  const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  for (const table of TABLES) {
    console.log(`\nMigrating table: ${table}...`);
    
    // 1. Fetch from Postgres
    const res = await pgClient.query(`SELECT * FROM ${table}`);
    const rows = res.rows.map((row: any) => row);
    console.log(`  Found ${rows.length} rows in Postgres.`);
    
    if (rows.length === 0) continue;

    // 2. Transform rows
    const columns = Object.keys(rows[0]);
    
    const transformedRows = rows.map(row => {
      const newRow: any = {};
      for (const col of columns) {
        let val = row[col];
        
        // Transform logic
        if (val === null || val === undefined) {
          newRow[col] = null;
        } else if (typeof val === "boolean") {
          newRow[col] = val ? 1 : 0;
        } else if (val instanceof Date) {
          newRow[col] = Math.floor(val.getTime() / 1000);
        } else if (typeof val === "object") {
          // JSON or arrays
          newRow[col] = JSON.stringify(val);
        } else {
          newRow[col] = val;
        }
      }
      return newRow;
    });

    // 3. Batch insert into Turso
    const BATCH_SIZE = 500;
    for (let i = 0; i < transformedRows.length; i += BATCH_SIZE) {
      const batch = transformedRows.slice(i, i + BATCH_SIZE);
      
      const statements = batch.map(row => {
        const cols = Object.keys(row);
        const placeholders = cols.map(() => '?').join(', ');
        const values = cols.map(c => row[c]);
        
        return {
          sql: `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
          args: values
        };
      });

      await tursoClient.batch(statements, "write");
      console.log(`  Inserted batch ${i} to ${i + batch.length}`);
    }

    // 4. Verify count
    const tursoCount = await tursoClient.execute(`SELECT COUNT(*) as count FROM ${table}`);
    const count = Number(tursoCount.rows[0].count);
    console.log(`  Turso count: ${count} / Postgres count: ${rows.length}`);
    if (count !== rows.length) {
      throw new Error(`Count mismatch on table ${table}! Postgres: ${rows.length}, Turso: ${count}`);
    }
  }

  await pgClient.end();
  console.log("\nMigration completed successfully.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
