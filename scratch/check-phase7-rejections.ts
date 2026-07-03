import { db } from '../lib/db';
import { users } from '../shared/schema.sqlite';
import { registerForEvent } from '../lib/routes/events';

async function registerEvent(eventId: string, userId: string) {
  const req: any = {
    params: { eventId },
    user: { id: userId },
  };

  const res: any = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    }
  };

  await registerForEvent(req, res, (err: any) => {
    if (err) throw err;
  });

  if (res.statusCode !== 200 && res.statusCode !== 201) {
    throw new Error(res.body?.message || "Unknown error");
  }
  return res.body;
}

async function main() {
  const eventId = "evt-test-1783025740508"; // use the one created before or create a new one
  // Let's create a new event first
  const { posts } = await import('../shared/schema.sqlite');
  const orgId = "org-stress-" + Date.now();
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
  
  const newEventId = "evt-stress-" + Date.now();
  await db.insert(posts).values({
    id: newEventId,
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
    maxCrossDeptParticipants: 5,
    eventDate: new Date(),
  });

  // Pre-create 20 users
  for (let i = 0; i < 20; i++) {
    const userId = `user-stress-${i}`;
    await db.insert(users).values({
      id: userId,
      email: userId + "@test.com",
      username: userId,
      name: userId,
      bio: "",
      portfolio: "",
      github: "",
      department: "Mathematics", 
    }).onConflictDoNothing();
  }

  console.log("Starting concurrent registrations...");
  const attempts = Array.from({ length: 20 }, (_, i) => registerEvent(newEventId, `user-stress-${i}`));
  const results = await Promise.allSettled(attempts);
  
  const succeeded = results.filter(r => r.status === "fulfilled").map((r: any) => r.value);
  const rejected = results.filter(r => r.status === "rejected").map((r: any) => r.reason.message);
  
  console.log("Succeeded count:", succeeded.length);
  console.log("Rejected count:", rejected.length);
  console.log("First few rejection reasons:", rejected.slice(0, 5));
}

main();
