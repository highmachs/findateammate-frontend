-- Update existing users with 'General' department to 'OTHER'
UPDATE "users"
SET "department" = 'OTHER'
WHERE "department" = 'General';
