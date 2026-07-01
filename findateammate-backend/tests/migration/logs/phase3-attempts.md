## Phase 3 - Attempt 1
**Root Cause**: The dynamic import of `backend/db.ts` failed because Node.js/Vitest does not natively resolve the `@shared` path alias defined in `tsconfig.json` at runtime. Additionally, `process.env.TURSO_DATABASE_URL` was `undefined` because `.env` variables were not loaded into the test process.
**Action**: Modified `backend/db.ts` to use a standard relative import (`../shared/schema.sqlite`) instead of the bundler-specific alias, and added `import "dotenv/config"` to the test file to ensure the Turso client successfully receives the correct credentials.
