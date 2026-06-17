-- Auto-verify all existing users (grandfathered users before email verification system)
-- This ensures existing 127 users can continue using the app without interruption

UPDATE users 
SET 
    email_verified_at = COALESCE(email_verified_at, NOW()),
    is_verified = true
WHERE email_verified_at IS NULL;
