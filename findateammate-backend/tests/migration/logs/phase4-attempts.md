## Phase 4 - Attempt 1
**Root Cause 1**: The AWS RDS Postgres instance (`process.env.DATABASE_URL`) is unreachable (`ENOTFOUND`) from this local machine due to VPC restrictions, causing 16 out of 17 parity tests to fail immediately upon invoking `pg.query()`. 
**Action 1**: Skipped the Postgres-dependent parity tests (the same infrastructural blockage established and accepted in Phase 1).

**Root Cause 2**: The test assertion `referential integrity: every post.author_id exists in users` failed because the `posts` table does not have an `author_id` column. The Postgres schema explicitly defines this relationship as `user_id`.
**Action 2**: Corrected the test assertion to query the correct column `user_id` from the `posts` table, which allowed the referential integrity check on the Turso database to pass successfully.
