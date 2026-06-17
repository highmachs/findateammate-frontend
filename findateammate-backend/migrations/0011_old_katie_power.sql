CREATE TABLE IF NOT EXISTS "error_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"username" text,
	"message" text NOT NULL,
	"stack" text,
	"source" text NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "error_logs_timestamp_idx" ON "error_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "error_logs_source_idx" ON "error_logs" USING btree ("source");