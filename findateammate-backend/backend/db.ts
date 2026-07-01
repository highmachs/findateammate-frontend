import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../shared/schema.sqlite";

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set.");
}

export const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

tursoClient.execute("PRAGMA journal_mode = WAL");
tursoClient.execute("PRAGMA busy_timeout = 5000");

export const db = drizzle(tursoClient, { schema });

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down...`);
    try {
        // Here we'd close the http server if it was passed here. 
        // Turso HTTP client doesn't need to be closed/drained like a stateful pool.
        console.log('✓ Application shutting down gracefully');
        process.exit(0);
    } catch (err) {
        console.error('✗ Error shutting down:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err: Error) => {
    console.error('✗ UNCAUGHT EXCEPTION:', err);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: any) => {
    console.error('✗ UNHANDLED REJECTION:', reason);
    gracefulShutdown('unhandledRejection');
});

// Ensure critical columns exist before the app starts serving requests.
export async function ensureCriticalSchemaCompat() {
    try {
        await tursoClient.execute(`ALTER TABLE users ADD COLUMN tour_completed INTEGER DEFAULT 0 NOT NULL`);
    } catch (err: any) {
        if (!/duplicate column/i.test(err.message)) {
            console.error('✗ Critical schema compatibility check failed:', err);
            throw err;
        }
    }
    
    try {
        await tursoClient.execute(`CREATE INDEX IF NOT EXISTS users_tour_completed_idx ON users(tour_completed)`);
    } catch (err: any) {
        console.error('✗ Failed to create index:', err);
        throw err;
    }
    
    console.log('✓ Critical schema compatibility checks passed');
}
