-- Migration: Remove primary skill column from users table
-- Only skills array (jsonb) will be used going forward

-- Remove the skill column
ALTER TABLE "users" DROP COLUMN IF EXISTS "skill";
