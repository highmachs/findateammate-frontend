CREATE TABLE "chats" (
	"id" text PRIMARY KEY NOT NULL,
	"user1_id" text NOT NULL,
	"user1_name" text NOT NULL,
	"user2_id" text NOT NULL,
	"user2_name" text NOT NULL,
	"last_message" text,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chats_user1_idx" ON "chats" USING btree ("user1_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chats_user2_idx" ON "chats" USING btree ("user2_id");