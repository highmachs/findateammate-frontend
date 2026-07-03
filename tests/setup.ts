import "dotenv/config";

// Verify all required env vars are present for tests
const required = [
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "SESSION_SECRET",
  "CRON_SECRET",
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  throw new Error(
    `Missing env vars for tests: ${missing.join(", ")}\n` +
    `Create a .env file with all required variables.`
  );
}
