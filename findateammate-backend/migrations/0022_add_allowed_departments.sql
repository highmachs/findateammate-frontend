ALTER TABLE "posts"
ADD COLUMN IF NOT EXISTS "allowed_departments" jsonb;