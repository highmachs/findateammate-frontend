CREATE TABLE "analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"event" text NOT NULL,
	"page" text NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "skill_level" text;