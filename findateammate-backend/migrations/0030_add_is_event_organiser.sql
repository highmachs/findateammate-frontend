-- Add is_event_organiser field to posts table
-- For intra-college events: indicates if the user is the event organiser/host (has organiser dashboard access)
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "is_event_organiser" boolean NOT NULL DEFAULT false;
