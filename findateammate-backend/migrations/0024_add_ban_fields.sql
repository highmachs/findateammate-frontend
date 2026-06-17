ALTER TABLE users ADD COLUMN is_banned boolean DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN ban_reason text;
ALTER TABLE users ADD COLUMN banned_at timestamp;

-- Add index for banned user queries
CREATE INDEX users_is_banned_idx ON users(is_banned);
