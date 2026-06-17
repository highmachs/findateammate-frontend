-- Add eventDate column to posts table for event expiration based on event date
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "event_date" timestamp;
