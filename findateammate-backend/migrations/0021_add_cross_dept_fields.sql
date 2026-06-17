-- Add cross-department event participation support
-- New columns for users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department" text NOT NULL DEFAULT 'General';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "skills" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "interests" jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Create index on department for filtering queries
CREATE INDEX IF NOT EXISTS "users_department_idx" ON "users"("department");

-- New columns for posts table (event registration settings)
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "event_type" text;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "cross_department_enabled" boolean NOT NULL DEFAULT true;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "required_skills" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "required_interests" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "max_cross_dept_participants" integer;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "cross_dept_requires_approval" boolean NOT NULL DEFAULT true;

-- Create indexes on required_skills and required_interests for GIN searches
CREATE INDEX IF NOT EXISTS "posts_required_skills_idx" ON "posts" USING gin("required_skills");
CREATE INDEX IF NOT EXISTS "posts_required_interests_idx" ON "posts" USING gin("required_interests");

-- Create event_registrations table for cross-department event participation
CREATE TABLE IF NOT EXISTS "event_registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"registration_type" text NOT NULL,
	"match_score" integer,
	"status" text NOT NULL DEFAULT 'pending',
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_registrations_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE cascade,
	CONSTRAINT "event_registrations_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);

-- Create indexes for event_registrations
CREATE INDEX IF NOT EXISTS "event_registrations_post_id_idx" ON "event_registrations"("post_id");
CREATE INDEX IF NOT EXISTS "event_registrations_user_id_idx" ON "event_registrations"("user_id");
CREATE INDEX IF NOT EXISTS "event_registrations_status_idx" ON "event_registrations"("status");
CREATE INDEX IF NOT EXISTS "event_registrations_type_idx" ON "event_registrations"("registration_type");
CREATE UNIQUE INDEX IF NOT EXISTS "event_registrations_unique_idx" ON "event_registrations"("post_id", "user_id");
CREATE INDEX IF NOT EXISTS "event_registrations_post_id_status_idx" ON "event_registrations"("post_id", "status");
CREATE INDEX IF NOT EXISTS "event_registrations_user_id_status_idx" ON "event_registrations"("user_id", "status");
