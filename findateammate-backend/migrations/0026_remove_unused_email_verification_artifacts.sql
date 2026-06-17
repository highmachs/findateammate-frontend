-- Align database with current shared/schema.ts
-- verification_token and password_resets are no longer used in backend code

ALTER TABLE "users" DROP COLUMN IF EXISTS "verification_token";
DROP TABLE IF EXISTS "password_resets";
