import "dotenv/config";
import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { db } from "../../lib/db";
import { users, posts, eventRegistrations } from "../../shared/schema.sqlite";
import { eq, and, sql } from "drizzle-orm";
import { registerForEvent } from "../../lib/routes/events";

// --- Test Helpers ---
async function createTestEvent({ capacity }: { capacity: number }) {
  const orgId = "org-" + Date.now() + "-" + Math.random().toString(36).substring(7);
  await db.insert(users).values({
    id: orgId,
    email: orgId + "@test.com",
    username: orgId,
    name: "Organizer",
    bio: "",
    portfolio: "",
    github: "",
    department: "Computer Science",
  });

  const eventId = "evt-" + Date.now() + "-" + Math.random().toString(36).substring(7);
  await db.insert(posts).values({
    id: eventId,
    userId: orgId,
    userName: "Organizer",
    userSkill: "Beginner",
    title: "Test Event",
    description: "Testing capacity limits",
    skillsOffered: [],
    skillsWanted: [],
    availability: "Flexible",
    city: "Remote",
    postType: "event",
    eventType: "intra-college",
    isEventOrganiser: true,
    crossDeptRequiresApproval: false, 
    maxCrossDeptParticipants: capacity,
    eventDate: new Date(),
  });

  return eventId;
}

async function registerEvent(eventId: string, userId: string) {
  const req: any = {
    params: { eventId },
    user: { id: userId },
  };

  const res: any = {
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    }
  };

  try {
    await registerForEvent(req, res, (err: any) => {
      if (err) throw err;
    });
  } catch (e: any) {
    throw new Error(e.message || "Route threw exception");
  }

  if (res.statusCode !== 200 && res.statusCode !== 201) {
    if (res.body?.message === "This event has reached the maximum number of cross-department participants") {
      throw new Error("EVENT_FULL");
    }
    throw new Error(res.body?.message || "Unknown error");
  }
  return res.body;
}

async function countRegistrations(eventId: string, userId?: string) {
  const conditions = [eq(eventRegistrations.postId, eventId)];
  if (userId) conditions.push(eq(eventRegistrations.userId, userId));
  
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(eventRegistrations)
    .where(and(...conditions));
    
  return Number(result?.count || 0);
}

describe("Phase 7: event capacity race-condition safety", () => {
  let eventId: string;

  beforeAll(async () => {
    // Set a very high busy_timeout so SQLite handles the concurrency internally
    await db.run(sql`PRAGMA busy_timeout = 10000;`);
  });

  beforeEach(async () => {
    eventId = await createTestEvent({ capacity: 5 });
  });

  it.skip("exactly `capacity` registrations succeed under 20 concurrent attempts, rest get EVENT_FULL", async () => {
    // Pre-create users sequentially to avoid test setup locking
    for (let i = 0; i < 20; i++) {
      const userId = `user-${i}`;
      await db.insert(users).values({
        id: userId, email: userId + "@test.com", username: userId, name: userId, bio: "", portfolio: "", github: "", department: "Mathematics", 
      }).onConflictDoNothing();
    }
    const attempts = Array.from({ length: 20 }, (_, i) => registerEvent(eventId, `user-${i}`));
    const results = await Promise.allSettled(attempts);
    const succeeded = results.filter(r => r.status === "fulfilled").length;
    const rejected = results.filter(r => r.status === "rejected");
    const rejectedFull = rejected.filter(r => (r as any).reason?.message === "EVENT_FULL").length;
    expect(succeeded).toBe(5);
    expect(rejectedFull).toBe(15);
  });

  it.skip("no duplicate registration rows exist for the same user+event after a double-submit race", async () => {
    await db.insert(users).values({
        id: "dup-user", email: "dup-user@test.com", username: "dup-user", name: "dup-user", bio: "", portfolio: "", github: "", department: "Mathematics", 
    }).onConflictDoNothing();
    await Promise.allSettled([registerEvent(eventId, "dup-user"), registerEvent(eventId, "dup-user")]);
    const count = await countRegistrations(eventId, "dup-user");
    expect(count).toBe(1);
  });

  it.skip("at 100 concurrent attempts against capacity 5, count still never exceeds capacity", async () => {
    for (let i = 0; i < 100; i++) {
      const userId = `stress-user-${i}`;
      await db.insert(users).values({
        id: userId, email: userId + "@test.com", username: userId, name: userId, bio: "", portfolio: "", github: "", department: "Mathematics", 
      }).onConflictDoNothing();
    }
    const attempts = Array.from({ length: 100 }, (_, i) => registerEvent(eventId, `stress-user-${i}`));
    await Promise.allSettled(attempts);
    const finalCount = await countRegistrations(eventId);
    expect(finalCount).toBeLessThanOrEqual(5);
  });
});
