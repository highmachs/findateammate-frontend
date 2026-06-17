# FindATeammate - Backend

This is the **backend-only** repository for FindATeammate, deployed on **Render**.

## Tech Stack

- **Node.js** with TypeScript
- **Express** for HTTP server
- **Socket.IO** for real-time chat
- **PostgreSQL** with Drizzle ORM
- **Passport.js** for Google OAuth
- **Argon2** for password hashing
- **Winston** for logging

## Environment Variables

Create a `.env` file:

```bash
NODE_ENV=production
DATABASE_URL=<your-postgres-url>
SESSION_SECRET=<strong-random-secret>
CSRF_SECRET=<generated-csrf-secret>
FRONTEND_URL=https://findateammate.online
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://findateammate-rpqh.onrender.com/api/auth/google/callback
SMTP_HOST=smtp.titan.email
SMTP_PORT=465
SMTP_USER=FindATeammate@findateammate.online
SMTP_PASS=<your-smtp-password>
PRODUCTION_DOMAIN=https://findateammate-rpqh.onrender.com
```

## Development

```bash
npm install
npm run dev
```

API runs on: `http://localhost:5000`

## Build

```bash
npm run build
```

Output: `dist/index.cjs`

## Deployment (Render)

1. Push this repo to GitHub
2. Create a new **Web Service** on Render
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. Add all environment variables listed above

## Database Migrations

```bash
npm run db:generate  # Generate migrations from schema changes
npm run db:migrate   # Run migrations
```

Migrations run automatically on startup.

## Frontend

The frontend is deployed separately on Vercel. See `findateammate-frontend` folder.
