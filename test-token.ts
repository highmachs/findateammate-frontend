import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { db } from './lib/db';
import { session } from './shared/schema.sqlite';
async function run() {
  console.log('Token:', process.env.TURSO_AUTH_TOKEN?.substring(0, 50));
  try {
    await db.select().from(session).limit(1);
    console.log('Success!');
  } catch (err) {
    console.error('Failed:', err);
  }
}
run();
