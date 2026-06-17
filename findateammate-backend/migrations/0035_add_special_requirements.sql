ALTER TABLE "posts"
ADD COLUMN IF NOT EXISTS "special_requirements" text;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'posts_special_requirements_len_check'
	) THEN
		ALTER TABLE "posts"
		ADD CONSTRAINT posts_special_requirements_len_check
		CHECK (
			special_requirements IS NULL
			OR char_length(special_requirements) <= 250
		);
	END IF;
END $$;
