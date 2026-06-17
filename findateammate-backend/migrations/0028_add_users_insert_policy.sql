-- Add missing INSERT policy for users table
-- This allows OAuth registration and user signup to work properly
-- RLS was enabled in migration 0004 but INSERT policy was never created

CREATE POLICY "users_insert_policy" ON "users" FOR INSERT WITH CHECK (
  -- Allow anyone to insert (registration is handled at application level)
  -- This is necessary for OAuth callbacks and user registration
  true
);

-- Add default value for privacy column
-- Migration 0000 created this as NOT NULL without a default, causing INSERT failures
ALTER TABLE "users" ALTER COLUMN "privacy" SET DEFAULT '{"showEmail":false,"showPortfolio":false,"showUniversity":false,"showCity":false}'::jsonb;
