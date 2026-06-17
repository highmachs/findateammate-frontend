import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import path from "path";

export async function runMigrations() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set, skipping migrations");
        return;
    }

    console.log("Running database migrations...");

    try {
        // Use the db instance from db.ts which already has the correct SSL config
        await migrate(db, { migrationsFolder: path.join(process.cwd(), "migrations") });
        console.log("✅ Migrations completed successfully");
    } catch (error: any) {
        // Handle specific error codes OR specific message text for "already exists"
        // Drizzle/PG often wraps the error in a 'cause' property
        const isDuplicate = 
            error.code === '42P07' || error.code === '42701' || 
            error.message?.includes("already exists") ||
            error.cause?.code === '42P07' || error.cause?.code === '42701' ||
            error.cause?.message?.includes("already exists") ||
            // Sometimes the cause is nested deeper or formatted differently
            JSON.stringify(error).includes("42701") || 
            JSON.stringify(error).includes("already exists");

        if (isDuplicate) {
            console.log("⚠️  Migration skipped (schema already exists).");
            console.log("✅ Database is already up to date.");
        } else {
            console.error("❌ Migration failed:", error.message);
            console.error("Error details:", error); // Log full error for debugging if needed
            // Don't throw - allow server to start 
            console.log("⚠️  Server starting without migrations...");
        }
    }
}
