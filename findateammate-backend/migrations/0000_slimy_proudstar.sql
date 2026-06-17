CREATE TABLE "connection_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"post_title" text NOT NULL,
	"from_user_id" text NOT NULL,
	"from_user_name" text NOT NULL,
	"from_user_skill" text NOT NULL,
	"to_user_id" text NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"text" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"skills_offered" jsonb NOT NULL,
	"skills_wanted" jsonb NOT NULL,
	"description" text NOT NULL,
	"availability" text NOT NULL,
	"city" text NOT NULL,
	"university" text,
	"event_name" text,
	"event_website" text,
	"event_details" text,
	"event_upvotes" integer DEFAULT 0,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"user_skill" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"skill" text NOT NULL,
	"bio" text NOT NULL,
	"portfolio" text NOT NULL,
	"github" text NOT NULL,
	"twitter" text,
	"linkedin" text,
	"university" text,
	"city" text,
	"privacy" jsonb NOT NULL
);
