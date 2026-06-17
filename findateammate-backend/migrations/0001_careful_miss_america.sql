ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "event_image" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "linkedin" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" text NOT NULL;