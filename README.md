# FindATeammate

This is the parent folder containing two separate repositories:

## 📂 Structure

```
findateammate/                           (parent folder)
├── findateammate-backend/               (backend repo - deploy to Render)
│   ├── backend/                         # Express API server
│   ├── migrations/                      # Database migrations
│   ├── shared/                          # Shared TypeScript schemas
│   ├── script/build.ts                  # Build script
│   └── package.json                     # Backend dependencies only
│
└── findateammate-frontend/              (frontend repo - deploy to Vercel)
    ├── src/                             # React application
    ├── public/                          # Static assets
    ├── shared/                          # Shared schemas (copy)
    └── package.json                     # Frontend dependencies only
```

## 🚀 Deployment

### Backend (Render)

```bash
cd findateammate-backend
git init
git add .
git commit -m "Initial backend commit"
git remote add origin <backend-repo-url>
git push -u origin main
```

Deploy to Render with:

- **Build**: `npm install && npm run build`
- **Start**: `npm start`

### Frontend (Vercel)

```bash
cd findateammate-frontend
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin <frontend-repo-url>
git push -u origin main
```

Deploy to Vercel with:

- **Framework**: Vite
- **Build**: `npm run build`
- **Output**: `dist`

## 🌐 Domains

- Public: `https://findateammate.online` and `https://findateammate.info` (point to Vercel)
- Backend: `https://findateammate-rpqh.onrender.com` (hidden from users, Vercel proxies API calls)

## 📋 Full Guide

See the [complete deployment guide](brain/2_repo_deployment_guide.md) for detailed instructions.
