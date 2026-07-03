## Phase 6 - Attempt 1
**Root Cause 1**: Vitest failed with `Error: Cannot find package '@shared/schema.sqlite'` when executing `backend/session.ts`. This was due to `@shared` alias not resolving in the Vitest test environment without path mapping. Additionally, `dotenv/config` was imported *after* the `TursoSessionStore` class, causing an environment variable error during class initialization.
**Action 1**: Changed the schema import inside `backend/session.ts` to use a relative path (`../shared/schema.sqlite`). Modified `phase6.test.ts` to lazily import `TursoSessionStore` inside the test blocks so that `dotenv/config` runs *before* the module is evaluated.

**Root Cause 2**: None. The `TursoSessionStore` logic (including the `onConflictDoUpdate` for upsert behavior during `set()`) was already implemented correctly.
**Action 2**: Ran `tests/migration/phase6.test.ts`. All assertions passed on the first run.
