-- Add behavioral tracking tables for personalization and recommendation engine

-- Post interactions table (clicks, views, skips)
CREATE TABLE IF NOT EXISTS "post_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"post_id" text NOT NULL,
	"interaction_type" text NOT NULL, -- 'view', 'click', 'skip', 'connection_request'
	"duration_seconds" integer, -- Time spent viewing (for 'view' type)
	"metadata" jsonb, -- Additional context (scroll position, device, etc.)
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_interactions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade,
	CONSTRAINT "post_interactions_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE cascade
);

-- Search queries table (learn user search patterns)
CREATE TABLE IF NOT EXISTS "user_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"query" text NOT NULL,
	"filters" jsonb, -- {type, city, skill, etc.}
	"results_count" integer,
	"clicked_post_ids" jsonb, -- Array of post IDs user clicked from results
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_searches_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);

-- User preferences (implicit learning from behavior)
CREATE TABLE IF NOT EXISTS "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"preferred_skills" jsonb DEFAULT '[]'::jsonb, -- Skills user clicks on most
	"preferred_cities" jsonb DEFAULT '[]'::jsonb, -- Cities user searches for
	"preferred_event_types" jsonb DEFAULT '[]'::jsonb, -- Event types user engages with
	"interaction_score" jsonb DEFAULT '{}'::jsonb, -- {postId: score} for collaborative filtering
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "post_interactions_user_id_idx" ON "post_interactions"("user_id");
CREATE INDEX IF NOT EXISTS "post_interactions_post_id_idx" ON "post_interactions"("post_id");
CREATE INDEX IF NOT EXISTS "post_interactions_type_idx" ON "post_interactions"("interaction_type");
CREATE INDEX IF NOT EXISTS "post_interactions_created_at_idx" ON "post_interactions"("created_at");

CREATE INDEX IF NOT EXISTS "user_searches_user_id_idx" ON "user_searches"("user_id");
CREATE INDEX IF NOT EXISTS "user_searches_created_at_idx" ON "user_searches"("created_at");
CREATE INDEX IF NOT EXISTS "user_searches_query_idx" ON "user_searches"("query");

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS "user_preferences_preferred_skills_idx" ON "user_preferences" USING gin("preferred_skills");
CREATE INDEX IF NOT EXISTS "user_preferences_interaction_score_idx" ON "user_preferences" USING gin("interaction_score");
