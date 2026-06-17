-- Add tour_completed field to users table (idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS tour_completed boolean DEFAULT false NOT NULL;

-- Backfill rollout baseline only for users that existed before rollout date
-- Rollout date: 2026-03-11 (new users from this date should still see tour)
UPDATE "users"
SET "tour_completed" = true
WHERE "created_at" < TIMESTAMP '2026-03-11 00:00:00'
	AND "tour_completed" = false;

-- Add index for tour-related queries (idempotent)
CREATE INDEX IF NOT EXISTS users_tour_completed_idx ON users(tour_completed);
