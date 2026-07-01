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

  let totalMismatches = 0;

  for (const table of TABLES) {
    console.log(`\nVerifying table: ${table}...`);
    
    // Sample 50 random rows from Postgres
    const res = await pgClient.query(`SELECT * FROM ${table} ORDER BY RANDOM() LIMIT 50`);
    const pgRows = res.rows;
    console.log(`  Sampled ${pgRows.length} rows.`);
    
    if (pgRows.length === 0) continue;

    // We assume there's a primary key to lookup the row in Turso.
    // If a table has multiple primary keys, this simplistic ID approach might fail,
    // but the FindATeammate schema relies heavily on `id` text pk or userId.
    const pkColumn = pgRows[0].id ? 'id' : (pgRows[0].userId ? 'userId' : (pgRows[0].user_id ? 'user_id' : null));
    
    if (!pkColumn) {
      console.log(`  [WARN] No primary key found for ${table}, skipping row-by-row verification.`);
      continue;
    }

    let mismatches = 0;
    
    for (const pgRow of pgRows) {
      const pkValue = pgRow[pkColumn];
      
      const tursoRes = await tursoClient.execute({
        sql: `SELECT * FROM ${table} WHERE ${pkColumn} = ?`,
        args: [pkValue]
      });
      
      if (tursoRes.rows.length === 0) {
        console.error(`  [ERROR] Row ${pkValue} missing in Turso!`);
        mismatches++;
        continue;
      }
      
      const tursoRow = tursoRes.rows[0];
      const cols = Object.keys(pgRow);
      
      for (const col of cols) {
        let pgVal = pgRow[col];
        let tursoVal = tursoRow[col];
        
        // Normalize pgVal for comparison
        if (typeof pgVal === "boolean") {
          pgVal = pgVal ? 1 : 0;
        } else if (pgVal instanceof Date) {
          pgVal = Math.floor(pgVal.getTime() / 1000);
        } else if (typeof pgVal === "object" && pgVal !== null) {
          pgVal = JSON.stringify(pgVal);
        } else if (pgVal === null || pgVal === undefined) {
          pgVal = null;
        }

        if (String(pgVal) !== String(tursoVal)) {
          // Note: JSON stringify might output keys in different orders or formatting,
          // so direct string comparison might raise false positives, but it's a good baseline.
          // Let's do a deep compare if both are valid JSON.
          try {
             if (JSON.stringify(JSON.parse(String(pgVal))) === JSON.stringify(JSON.parse(String(tursoVal)))) {
               continue;
             }
          } catch (e) {
             // Not JSON, continue to mismatch
          }
          console.error(`  [MISMATCH] Table: ${table} | Row: ${pkValue} | Col: ${col} | PG: ${pgVal} | Turso: ${tursoVal}`);
          mismatches++;
        }
      }
    }
    
    if (mismatches === 0) {
      console.log(`  ✓ Table ${table} verified successfully.`);
    } else {
      console.log(`  ✗ Table ${table} had ${mismatches} mismatches.`);
      totalMismatches += mismatches;
    }
  }

  await pgClient.end();
  
  if (totalMismatches === 0) {
    console.log("\nAll sampled rows matched perfectly!");
  } else {
    console.error(`\nFound ${totalMismatches} total mismatches across the schema.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
