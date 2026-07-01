import "dotenv/config";
import { db } from "../backend/db";
import { storage } from "../backend/storage";
import { users } from "@shared/schema.sqlite";
import { eq } from "drizzle-orm";

async function runTests() {
  console.log("=== Phase 9 Staging Validation Script ===");
  
  // 1. Fetch an existing user instead of creating a mock one
  console.log(`[Auth Flow] Fetching a valid user...`);
  
  const allUsers = await db.query.users.findMany({ limit: 1 });
  if (allUsers.length === 0) {
     throw new Error("No users found in database to test with!");
  }
  const newUser = allUsers[0];
  
  console.log(`✅ User fetched with ID: ${newUser.id}`);

  console.log("\n[JSON Array Validation] Fetching an existing Post to verify data structures...");
  
  const allPosts = await db.query.posts.findMany({ limit: 1 });
  if (allPosts.length === 0) {
    throw new Error("No posts found in database to test with! Create one manually first.");
  }
  const fetchedPost = allPosts[0];

  // We want to ensure skillsWanted is a proper JavaScript Array, not a string like "[\"React\"]"
  const skillsWanted = fetchedPost.skillsWanted;
  const isArray = Array.isArray(skillsWanted);
  
  console.log(`skillsWanted Type: ${typeof skillsWanted}`);
  console.log(`skillsWanted IsArray: ${isArray}`);
  console.log(`skillsWanted Value:`, skillsWanted);

  if (isArray) {
    console.log("✅ SUCCESS: JSON fields are properly deserialized from SQLite!");
  } else {
    console.log("❌ FAILED: JSON fields are stringified or corrupt. Drizzle is not parsing them.");
  }
  
  console.log("\n=== Validation Complete ===");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
