ALTER TABLE IF EXISTS "chats" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE IF EXISTS "chats" CASCADE;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "requests_unique_idx" ON "connection_requests" USING btree ("from_user_id","to_user_id","post_id");