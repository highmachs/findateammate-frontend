import "dotenv/config";
import { users, posts, eventRegistrations } from "@shared/schema.sqlite";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

async function main() {
  const { db } = await import("../backend/db");
  console.log("Setting up concurrency test...");

  // 1. Create a dummy event with capacity 5
  const eventId = nanoid();
  const hostId = nanoid();
  
  await db.insert(users).values({
    id: hostId,
    email: `host-${hostId}@test.com`,
    username: `host_${hostId}`,
    password: "dummy_password",
    name: "Host User",
    bio: "Test host bio",
    portfolio: "https://portfolio.com",
    github: "hostgithub",
    skills: [],
    interests: [],
    tourCompleted: true
  });

  await db.insert(posts).values({
    id: eventId,
    title: "Concurrency Test Event",
    eventName: "Concurrency Test",
    eventDate: new Date(Date.now() + 86400000),
    city: "Virtual",
    maxCrossDeptParticipants: 5,
    skillsOffered: [],
    skillsWanted: [],
    description: "Testing SQLite locks",
    availability: "Available",
    userId: hostId,
    userName: "Host User",
    userSkill: "Expert"
  });

  // 2. Create 20 dummy users
  const testUsers = Array.from({ length: 20 }, () => nanoid());
  for (const uid of testUsers) {
    await db.insert(users).values({
      id: uid,
      email: `test-${uid}@test.com`,
      username: `test_${uid}`,
      password: "dummy_password",
      name: "Test User " + uid,
      bio: "Test bio",
      portfolio: "https://test.com",
      github: "testgithub" + uid,
      skills: [],
      interests: [],
      tourCompleted: true
    });
  }

  console.log(`Created event ${eventId} with capacity 5.`);
  console.log("Firing 20 concurrent registration requests...");

  // 3. Fire 20 simultaneous registrations, just like the actual endpoint logic
  // We use the exact same transaction block to verify the SQLite driver locks correctly.
  let successCount = 0;
  let failCount = 0;

  const promises = testUsers.map(async (uid) => {
    try {
      await db.transaction(async (tx) => {
        // Fetch event capacity
        const [event] = await tx
          .select({ maxCrossDeptParticipants: posts.maxCrossDeptParticipants })
          .from(posts)
          .where(eq(posts.id, eventId));

        if (!event) throw new Error("EVENT_NOT_FOUND");

        // Count current registrations
        const crossDeptCount = await tx
          .select({ count: db.$count(eventRegistrations, eq(eventRegistrations.postId, eventId)) })
          .from(eventRegistrations)
          .where(eq(eventRegistrations.postId, eventId));

        const count = Number(crossDeptCount[0]?.count || 0);

        if (event.maxCrossDeptParticipants && count >= event.maxCrossDeptParticipants) {
          throw new Error("CAPACITY_EXCEEDED");
        }

        // Insert new registration
        await tx.insert(eventRegistrations).values({
          postId: eventId,
          userId: uid,
          registrationType: "cross_department",
          status: "confirmed"
        });
      });
      successCount++;
    } catch (err: any) {
      if (err.message === "CAPACITY_EXCEEDED") {
        failCount++;
      } else {
        console.error(`Unexpected error for user ${uid}:`, err);
      }
    }
  });

  await Promise.all(promises);

  console.log("--- Results ---");
  console.log(`Successful Registrations: ${successCount} (Expected: 5)`);
  console.log(`Failed (Capacity Exceeded): ${failCount} (Expected: 15)`);
  
  if (successCount === 5 && failCount === 15) {
    console.log("✅ Concurrency test passed! Zero overbooking.");
  } else {
    console.error("❌ Concurrency test failed!");
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up test data...");
  await db.delete(posts).where(eq(posts.id, eventId));
  for (const uid of testUsers) {
    await db.delete(users).where(eq(users.id, uid));
  }
  await db.delete(users).where(eq(users.id, hostId));
  console.log("Cleanup complete.");
  process.exit(0);
}

main().catch(console.error);
