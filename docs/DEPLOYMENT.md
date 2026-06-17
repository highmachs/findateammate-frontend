# Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- PM2 installed globally: `npm install -g pm2`

## Initial Deployment

### 1. Environment Setup

```bash
# Copy and configure environment variables
cp .env.example .env
nano .env  # Set SESSION_SECRET, DATABASE_URL, PRODUCTION_DOMAIN
```

### 2. Database Setup

```bash
# Run migrations
npm run db:migrate
```

### 3. Build Application

```bash
npm run build
```

### 4. Start with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

## Deployment Updates

### Standard Update

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Rebuild
npm run build

# Restart with zero downtime
pm2 reload findateammate
```

### Emergency Rollback

```bash
# Stop current version
pm2 stop findateammate

# Revert to previous commit
git reset --hard HEAD~1

# Rebuild
npm run build

# Restart
pm2 start findateammate
```

## Monitoring

### Check Status

```bash
pm2 status
pm2 logs findateammate
pm2 monit
```

### Health Check

```bash
curl http://localhost:5000/health
```

## Backup & Restore

### Database Backup

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restore

```bash
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

## Troubleshooting

### App Won't Start

1. Check logs: `pm2 logs findateammate --lines 100`
2. Verify environment variables: `pm2 env 0`
3. Check database connection: `psql $DATABASE_URL`

### High Memory Usage

```bash
pm2 restart findateammate
```

### Clear Logs

```bash
pm2 flush
```
