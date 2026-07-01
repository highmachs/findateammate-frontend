import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./db";
import path from "path";

export async function runMigrations() {
    if (!process.env.TURSO_DATABASE_URL) {
        console.error("TURSO_DATABASE_URL is not set, skipping migrations");
        return;
    }

    console.log("Running database migrations...");

    try {
        await migrate(db, { migrationsFolder: path.join(process.cwd(), "migrations") });
        console.log("✅ Migrations completed successfully");
    } catch (error: any) {
        const isDuplicate = 
            error.message?.includes("already exists") ||
            error.cause?.message?.includes("already exists") ||
            JSON.stringify(error).includes("already exists");

        if (isDuplicate) {
            console.log("⚠️  Migration skipped (schema already exists).");
            console.log("✅ Database is already up to date.");
        } else {
            console.error("❌ Migration failed:", error.message);
            console.error("Error details:", error); 
            console.log("⚠️  Server starting without migrations...");
        }
    }
}
