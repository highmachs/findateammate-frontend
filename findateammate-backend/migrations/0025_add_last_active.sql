-- Add last_active field to users table
ALTER TABLE users ADD COLUMN last_active timestamp;

-- Set existing users' last_active to their created_at as a default
UPDATE users SET last_active = created_at WHERE last_active IS NULL;
