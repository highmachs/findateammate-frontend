# Serverless Deployment Guide

This guide details the modern, serverless architecture for FindATeammate, running on Vercel (API & Frontend), Turso (SQLite), Upstash (Redis), and PartyKit (WebSockets).

## Architecture Overview

- **Frontend & API**: Hosted on Vercel. Both static assets (Vite React) and serverless backend routes (`/api/*`) are deployed together.
- **Database**: Turso (libSQL/SQLite at the edge).
- **Rate Limiting**: Upstash Redis via `@upstash/ratelimit`.
- **WebSockets**: PartyKit (Cloudflare Workers) handles all real-time chat, notifications, and global broadcasts.

---

## 1. Environment Setup

Copy `.env.example` to `.env.production` (if deploying to Vercel/PartyKit from CLI) or configure these directly in your platform dashboards.

### Required Variables:
```env
# Turso Database
TURSO_DATABASE_URL=libsql://<your-db>.turso.io
TURSO_AUTH_TOKEN=<your-token>

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://<your-redis>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token>

# Security
SESSION_SECRET=<random-32-char-string>
CRON_SECRET=<random-32-char-string>

# PartyKit / WebSockets
PARTYKIT_HOST=<your-partykit-app>.partykit.dev
VITE_PARTYKIT_HOST=<your-partykit-app>.partykit.dev
PARTYKIT_SECRET=<random-32-char-string>
WS_JWT_SECRET=<random-32-char-string>

# Networking
VERCEL_API_URL=https://<your-vercel-domain>.vercel.app
```

---

## 2. Deploying PartyKit (WebSockets)

PartyKit requires deploying via their CLI directly to Cloudflare edge networks.

```bash
# 1. Login and deploy to Cloudflare
npx partykit deploy

# 2. Add your secrets to the Cloudflare environment
npx partykit env push
```

*Note: Your `npx partykit env push` will upload the `PARTYKIT_SECRET`, `WS_JWT_SECRET`, and `VERCEL_API_URL` variables defined in your local `.env`.*

---

## 3. Deploying Vercel (API & Frontend)

You can connect your GitHub repository directly to Vercel for automatic CI/CD deployments.

### Manual Vercel Deployment

If deploying manually via CLI:
```bash
# Link project and push environment variables
npx vercel link
npx vercel env pull .env
# (Add your production secrets to the dashboard)

# Deploy to production
npx vercel --prod
```

### Vercel Configuration Notes
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- Vercel automatically detects `api/` and routes serverless functions.
- Ensure `vercel.json` contains the CRON schedule for `api/internal/daily-cleanup`.

---

## 4. Database Migrations (Turso)

Schema changes are managed by Drizzle ORM.

```bash
# Generate migration files locally
npm run db:generate

# Apply migrations to production Turso database
npm run db:push
```

---

## Troubleshooting

### Real-time events aren't firing
- Check the Vercel logs to ensure `PARTYKIT_SECRET` and `PARTYKIT_HOST` are set correctly in Vercel.
- Run `npx partykit tail` to view live logs from your Cloudflare WebSocket instances.

### Rate limiting returning 401s in E2E tests
- Ensure `UPSTASH_REDIS_REST_URL` is set, otherwise the fallback rate limiters might block abusive test traffic.
- If running Playwright E2E tests, ensure `.env` is loaded by Vite.
