/**
 * Database Connection Pool Health Monitor
 * Run: ts-node script/check-db-health.ts
 * 
 * Checks:
 * - Pool connection status
 * - Active vs idle connections
 * - Query timeout settings
 * - Connection leaks (stale connections)
 */

import { pool } from "../backend/db";

async function checkDatabaseHealth() {
  console.log("\n📊 Database Connection Pool Health Report");
  console.log("=".repeat(50));

  try {
    // Get pool stats
    const totalConnections = pool.totalCount;
    const idleConnections = pool.idleCount;
    const activeConnections = totalConnections - idleConnections;

    console.log(`\n✓ Connection Status:`);
    console.log(`  - Total Pool Size: ${totalConnections}`);
    console.log(`  - Active Connections: ${activeConnections}`);
    console.log(`  - Idle Connections: ${idleConnections}`);
    console.log(`  - Utilization: ${((activeConnections / totalConnections) * 100).toFixed(1)}%`);

    // Pool configuration
    console.log(`\n✓ Pool Configuration:`);
    console.log(`  - Max Connections: ${pool.options?.max || 10}`);
    console.log(`  - Idle Timeout: ${pool.options?.idleTimeoutMillis || 10000}ms`);
    console.log(`  - Connection Timeout: ${pool.options?.connectionTimeoutMillis || 5000}ms`);
    console.log(`  - Statement Timeout: ${pool.options?.statement_timeout || 30000}ms`);

    // Test query
    const result = await pool.query("SELECT NOW() as current_time, version() as db_version");
    console.log(`\n✓ Database Query Test:`);
    console.log(`  - Status: ✓ OK`);
    console.log(`  - Timestamp: ${result.rows[0].current_time}`);
    console.log(`  - Version: ${result.rows[0].db_version.split(",")[0]}`);

    // Check for long-running queries
    const longQueries = await pool.query(`
      SELECT 
        pid,
        usename,
        application_name,
        state,
        query,
        EXTRACT(EPOCH FROM (NOW() - query_start))::int as duration_seconds
      FROM pg_stat_activity
      WHERE query_start < NOW() - INTERVAL '5 minutes'
      AND state != 'idle'
      ORDER BY query_start ASC
    `);

    if (longQueries.rows.length > 0) {
      console.log(`\n⚠️  Long-Running Queries (>5min):`);
      longQueries.rows.forEach((q: any) => {
        console.log(`  - PID ${q.pid}: ${q.duration_seconds}s - ${q.query.substring(0, 50)}...`);
      });
    } else {
      console.log(`\n✓ No long-running queries detected`);
    }

    // Check connection status
    const connStatus = await pool.query(`
      SELECT 
        state,
        COUNT(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
      ORDER BY count DESC
    `);

    console.log(`\n✓ Connection States:`);
    connStatus.rows.forEach((row: any) => {
      console.log(`  - ${row.state || "idle"}: ${row.count}`);
    });

    console.log("\n" + "=".repeat(50));
    console.log("✓ Database pool health check completed successfully\n");

  } catch (error: any) {
    console.error("\n❌ Health Check Failed:");
    console.error(error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Verify DATABASE_URL environment variable is set");
    console.error("2. Check database credentials");
    console.error("3. Verify network connectivity to database");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkDatabaseHealth().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
