# Local Development Environment

For the local development environment, three processes must be running simultaneously for realtime features to work locally:
1. `npm run dev` (Vite, frontend)
2. `npm run dev:api` (Express API)
3. `npm run dev:ws` (PartyKit realtime server)

### One-time setup
You must create `.env.local` and `.dev.vars` files in the project root to ensure local processes communicate with each other correctly instead of hitting production endpoints.

**.env.local:**
```
VITE_PARTYKIT_HOST=localhost:1999
PARTYKIT_HOST=localhost:1999
```

**.dev.vars:**
```
VERCEL_API_URL=http://localhost:3000
PARTYKIT_SECRET=<same as .env>
WS_JWT_SECRET=<same as .env>
```
