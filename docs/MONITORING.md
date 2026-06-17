# PM2 Monitoring & Alerts Setup

## Built-in PM2 Monitoring

PM2 provides built-in monitoring capabilities:

```bash
# Real-time monitoring
pm2 monit

# Web-based dashboard
pm2 plus
```

## PM2 Plus (Free Tier)

1. **Sign up**: https://app.pm2.io/
2. **Link your server**:

```bash
pm2 link <secret_key> <public_key>
```

3. **Features**:
   - Real-time metrics (CPU, memory, event loop)
   - Error tracking and alerting
   - Custom metrics
   - Log management
   - Email/Slack notifications

## Custom Alerts Configuration

Add to `ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [
    {
      name: "findateammate",
      script: "dist/index.cjs",
      // ... existing config

      // Alert configuration
      max_memory_restart: "500M", // Restart if memory exceeds 500MB

      // PM2 Plus metrics
      pmx: true,

      // Custom metrics
      instance_var: "INSTANCE_ID",
    },
  ],
};
```

## Log Monitoring

Logs are stored in `./logs/` with daily rotation:

- `error-YYYY-MM-DD.log` - Error logs (14 days retention)
- `combined-YYYY-MM-DD.log` - All logs (14 days retention)
- `access-YYYY-MM-DD.log` - HTTP access logs (7 days retention)

### View logs:

```bash
# PM2 logs
pm2 logs findateammate

# Tail error logs
tail -f logs/error-$(date +%Y-%m-%d).log

# Search logs
grep "ERROR" logs/combined-*.log
```

## Health Monitoring Script

Create a cron job to check health endpoint:

```bash
# Add to crontab (every 5 minutes)
*/5 * * * * curl -f http://localhost:5000/health || echo "Health check failed" | mail -s "FindATeammate Down" admin@yourdomain.com
```

## Metrics to Monitor

1. **Application Metrics**:
   - Response time (target: <200ms)
   - Error rate (target: <1%)
   - Request throughput
   - Memory usage (alert if >80%)
   - CPU usage (alert if >80%)

2. **Database Metrics**:
   - Connection pool usage
   - Query execution time
   - Slow queries (>1s)

3. **Business Metrics**:
   - User signups
   - Post creation rate
   - Active connections
   - Message throughput

## Alert Channels

Configure in PM2 Plus dashboard:

- Email notifications
- Slack webhooks
- PagerDuty integration
- Custom webhooks

## Production Checklist

- [x] Winston logging configured
- [x] Daily log rotation enabled
- [x] PM2 process manager configured
- [x] Health check endpoint available
- [ ] PM2 Plus linked (optional)
- [ ] Alert thresholds configured
- [ ] Monitoring dashboard set up
