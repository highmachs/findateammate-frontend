# FindATeammate - Frontend

This is the **frontend-only** repository for FindATeammate, deployed on **Vercel**.

## Tech Stack!

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **TanStack Query** for data fetching
- **Wouter** for routing
- **Socket.IO Client** for real-time chat

## Environment Variables

Create a `.env` file (optional, as Vercel rewrites handle API routing):

```bash
# Leave empty - Vercel rewrites proxy to backend
VITE_API_URL=
```

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
```

Output: `dist/`

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import to Vercel
3. **Framework**: Vite
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Environment Variables**: Leave `VITE_API_URL` empty (rewrites handle it)

## API Backend

The backend is deployed separately on Render. Vercel's `vercel.json` rewrites handle proxying `/api/*` requests to the backend.

## Domain

Public URL: `https://findateammate.online` and `https://findateammate.info`
