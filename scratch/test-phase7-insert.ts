import { db } from '../lib/db';
import { users, posts } from '../shared/schema.sqlite';

async function main() {
  try {
    const orgId = "org-test-" + Date.now();
    await db.insert(users).values({
      id: orgId,
      email: orgId + "@test.com",
      username: orgId,
      name: "Organizer",
      bio: "",
      portfolio: "",
      github: "",
      department: "Computer Science",
    } as any);

    const eventId = "evt-test-" + Date.now();
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
      maxCrossDeptParticipants: 5,
      eventDate: new Date(),
    } as any);
    console.log("Success");
  } catch (err) {
    console.error("FULL ERROR:", err);
  }
}

main();
