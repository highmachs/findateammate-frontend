import { pool } from "../backend/db";

async function migrateLastActive() {
    try {
        console.log("Adding last_active column to users table...");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active timestamp");
        console.log("✅ Migration successful!");
        
        // Set existing users' last_active to their created_at
        console.log("Setting initial last_active values...");
        const result = await pool.query("UPDATE users SET last_active = created_at WHERE last_active IS NULL");
        console.log(`✅ Updated ${result.rowCount} users!`);
    } catch (error: any) {
        console.error("❌ Migration failed:", error.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migrateLastActive();
