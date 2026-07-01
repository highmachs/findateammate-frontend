# Database Management Guide (Turso / libSQL)

> [!WARNING]
> FindATeammate has migrated from Dockerized PostgreSQL to Turso (serverless SQLite). The previous `docker-compose` routines and `.sh`/`.ps1` backup scripts are deprecated. 

## Turso Architecture

FindATeammate now utilizes **Turso** via `@libsql/client`. 
- **Production URL**: Controlled by `TURSO_DATABASE_URL` (typically `libsql://...`)
- **Authentication**: `TURSO_AUTH_TOKEN` is strictly required to connect.
- **Local Fallback**: For local offline development, `TURSO_DATABASE_URL=file:./local.db` triggers local SQLite file storage, which is perfectly compatible with the application's queries.

## Managing the Database

### Local Development
When working locally, you can use a local SQLite file (e.g. `file:./local.db`). The `drizzle-kit` tool manages migrations natively:

```bash
# Push schema updates directly to the local file
npm run db:push

# Generate migration files
npm run db:generate
```

### Accessing Production Turso Shell
To access the database manually, use the Turso CLI:

```bash
# Authenticate (One-time)
turso auth login

# Connect to production database shell
turso db shell findateammate-prod

# Example queries:
# > .tables
# > SELECT * FROM users LIMIT 10;
```

## Backups & Restores

Since Turso is fully managed, daily automated backups are handled natively by the Turso platform rather than local cron-jobs. You can initiate manual dumps from the Turso CLI if you wish to export the data.

```bash
# Export production DB to a local file
turso db dump findateammate-prod > backup.sql
```

## Creating Test Accounts

You can insert test users locally using standard API routes:

```powershell
curl -X POST http://localhost:5000/api/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@test.com\",\"password\":\"test123\",\"username\":\"testuser\"}'
```

Or you can use Drizzle Studio to manually insert rows graphically:
```bash
npx drizzle-kit studio
```

## Concurrency & Limits
- **Turso Single-Writer**: Writes are automatically serialized through the primary node. We use standard Drizzle atomic `db.transaction(async (tx) => { ... })` scopes (which inherently issue `BEGIN IMMEDIATE` to prevent double-booking) instead of Postgres `FOR UPDATE` read-locks. 
- **Session State**: Sessions are stored directly in SQLite using our custom `TursoSessionStore` extending `express-session`, completely replacing `connect-pg-simple`.

## Rollback (Emergency PostgreSQL Cutover Reversal)
For 7 days post-cutover, the legacy Render RDS Postgres database remains online (read-only mode). To temporarily revert to PostgreSQL (if catastrophic failure occurs):
1. Re-add `pg` and `connect-pg-simple` packages via `npm i`.
2. Flip the configuration in `.env` to restore `DATABASE_URL` holding the PostgreSQL connection string. 
3. Re-enable `pg.Pool` initialization inside `backend/db.ts`. 

Do not delete the legacy PostgreSQL database from Render until the 7-day safety window expires!
