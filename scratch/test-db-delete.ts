import { db } from '../lib/db';
import { auditLogs } from '../shared/schema.sqlite';
import { lt } from 'drizzle-orm';

async function main() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const deleted = await db
      .delete(auditLogs)
      .where(lt(auditLogs.timestamp, thirtyDaysAgo))
      .returning({ id: auditLogs.id });
    console.log("Deleted count:", deleted.length);
  } catch (err) {
    console.error("FULL ERROR:", err);
  }
}

main();
