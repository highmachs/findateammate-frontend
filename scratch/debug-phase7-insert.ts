import { db } from '../lib/db';
import { users, posts } from '../shared/schema.sqlite';

async function main() {
  try {
    for (let i = 0; i < 3; i++) {
      console.log(`Iteration ${i}...`);
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
      console.log(`Success ${orgId}`);
    }
  } catch (err: any) {
    console.error("FULL ERROR:", err);
    console.error("Underlying cause:", err.cause);
  }
}

main();
