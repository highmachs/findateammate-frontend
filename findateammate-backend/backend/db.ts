import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

import fs from "fs";
import path from "path";

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
    );
}

const getSSLConfig = () => {
    if (process.env.DATABASE_URL?.includes("render.com")) {
        return { rejectUnauthorized: false };
    }
    
    if (process.env.DATABASE_URL?.includes("rds.amazonaws.com")) {
        const certPath = path.join(process.cwd(), "certs", "global-bundle.pem");
        if (fs.existsSync(certPath)) {
            return {
                rejectUnauthorized: true,
                ca: fs.readFileSync(certPath).toString(),
            };
        }
        console.warn("AWS RDS SSL certificate not found at", certPath);
        return { rejectUnauthorized: false }; // Fallback
    }
    
    return undefined;
};

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000, // 30-second query timeout to prevent hanging connections
    ssl: getSSLConfig(),
});

// Handle pool errors to prevent unhandled rejections
pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle database client:', err);
    // Don't exit the process, just log the error
});

// Log pool events for monitoring
pool.on('connect', () => {
    console.log('Database connection established');
});

pool.on('remove', () => {
    console.log('Database connection removed');
});

// Monitor active connections (every 60 seconds)
setInterval(() => {
    console.log(`[DB Pool] Active: ${pool.totalCount - pool.idleCount}/${pool.totalCount}, Idle: ${pool.idleCount}`);
}, 60000);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Closing database pool...`);
    try {
        // Drain any pending queries (20-second timeout)
        const drainTimeout = setTimeout(() => {
            console.warn('Drain timeout reached, force closing pool');
            process.exit(0);
        }, 20000);

        await pool.end();
        clearTimeout(drainTimeout);
        console.log('✓ Database pool closed gracefully');
        process.exit(0);
    } catch (err) {
        console.error('✗ Error closing database pool:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions to prevent zombie connections
process.on('uncaughtException', (err: Error) => {
    console.error('✗ UNCAUGHT EXCEPTION:', err);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
    console.error('✗ UNHANDLED REJECTION:', reason);
    gracefulShutdown('unhandledRejection');
});

export const db = drizzle(pool, { schema });

// Ensure critical columns exist before the app starts serving requests.
// This protects auth and /api/me from crashing when background migrations are still running.
export async function ensureCriticalSchemaCompat() {
    try {
        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS tour_completed boolean DEFAULT false NOT NULL
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS users_tour_completed_idx
            ON users(tour_completed)
        `);

        console.log('✓ Critical schema compatibility checks passed');
    } catch (err) {
        console.error('✗ Critical schema compatibility check failed:', err);
        throw err;
    }
}
