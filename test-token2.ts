import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const { db } = await import('./lib/db.js');
const { session } = await import('./shared/schema.sqlite.js');
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
