/**
 * Migrate existing user skills to whitelist
 * 
 * This script:
 * 1. Queries all users with existing skills/interests
 * 2. Uses fuzzy matching to map to whitelist values
 * 3. Updates user records with matched skills
 * 4. Generates migration report
 * 
 * Run with: npx tsx script/migrate-user-skills.ts [--dry-run]
 */

import { db } from "../backend/db";
import { users } from "@shared/schema";
import { findClosestSkillMatch } from "@shared/constants";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

interface MigrationResult {
  userId: string;
  username: string;
  email: string;
  oldSkills: string[];
  newSkills: string[];
  newInterests: string[];
  changed: boolean;
}

function matchSkillsToWhitelist(skills: string[]): string[] {
  const matched = new Set<string>();
  
  for (const skill of skills) {
    if (!skill || typeof skill !== "string") continue;
    
    const trimmed = skill.trim();
    if (!trimmed) continue;
    
    // Try to find closest match
    const match = findClosestSkillMatch(trimmed);
    if (match) {
      matched.add(match);
    }
  }
  
  return Array.from(matched);
}

async function migrateUserSkills(dryRun: boolean = false) {
  console.log(`\n🔄 Starting user skills migration ${dryRun ? "(DRY RUN)" : "(LIVE)"}...\n`);
  
  const results: MigrationResult[] = [];
  
  try {
    // Query users with any skills/interests so we can normalize to whitelist values.
    const usersWithData = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        skills: users.skills,
        interests: users.interests,
      })
      .from(users)
      .where(
        sql`(array_length(${users.skills}, 1) IS NOT NULL AND array_length(${users.skills}, 1) > 0)
             OR (array_length(${users.interests}, 1) IS NOT NULL AND array_length(${users.interests}, 1) > 0)`
      );
    
    console.log(`📊 Found ${usersWithData.length} users with legacy skill data\n`);
    
    for (const user of usersWithData) {
      const oldSkills = Array.isArray(user.skills) ? user.skills : [];
      const oldInterests = Array.isArray(user.interests) ? user.interests : [];
      const sourceValues = [...oldSkills, ...oldInterests]
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      
      // Match each part to whitelist
      const newSkills = matchSkillsToWhitelist(sourceValues);
      const newInterests = matchSkillsToWhitelist(oldInterests);
      
      const changed = JSON.stringify(newSkills) !== JSON.stringify(oldSkills) || JSON.stringify(newInterests) !== JSON.stringify(oldInterests);
      
      results.push({
        userId: user.id,
        username: user.username,
        email: user.email,
        oldSkills,
        newSkills,
        newInterests,
        changed,
      });
      
      // Update database if not dry run
      if (!dryRun && changed) {
        await db
          .update(users)
          .set({
            skills: newSkills.length > 0 ? newSkills : [],
            interests: newInterests.length > 0 ? newInterests : [],
          })
          .where(sql`${users.id} = ${user.id}`);
      }
      
      // Log progress
      if (changed) {
        console.log(`✓ ${user.username} (${user.email})`);
        console.log(`  Old Skills: [${oldSkills.join(", ")}]`);
        console.log(`  New Skills: [${newSkills.join(", ")}]`);
        console.log();
      }
    }
    
    // Generate summary
    const totalChanged = results.filter(r => r.changed).length;
    
    console.log("\n📈 Migration Summary:");
    console.log(`   Total users processed: ${results.length}`);
    console.log(`   Users with changes: ${totalChanged}`);
    console.log(`   Skills mapped: ${results.reduce((sum, r) => sum + r.newSkills.length, 0)}`);
    
    // Generate CSV report
    const csvRows = [
      ["User ID", "Username", "Email", "Old Skill (Legacy)", "New Skills", "Changed"]
    ];
    
    for (const result of results) {
      csvRows.push([
        result.userId,
        result.username,
        result.email,
        result.oldSkills.join("; "),
        result.newSkills.join("; "),
        result.changed ? "Yes" : "No",
      ]);
    }
    
    const csv = csvRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const reportPath = path.join(process.cwd(), "backups", `skill-migration-${Date.now()}.csv`);
    
    // Ensure backups directory exists
    const backupsDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, csv);
    console.log(`\n📄 Report saved to: ${reportPath}`);
    
    if (dryRun) {
      console.log("\n⚠️  This was a DRY RUN - no changes were made to the database.");
      console.log("   Run without --dry-run flag to apply changes.\n");
    } else {
      console.log("\n✅ Migration completed successfully!\n");
    }
    
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}

// Parse command line arguments
const dryRun = process.argv.includes("--dry-run");

// Run migration
migrateUserSkills(dryRun)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
