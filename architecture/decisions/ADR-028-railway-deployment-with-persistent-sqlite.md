# ADR-028: Railway Deployment with Persistent SQLite

## Status

**Accepted** - February 7, 2026

## Context

The application uses SQLite with TypeORM (per [ADR-002](./ADR-002-SQLite-TypeOrm-for-persistence.md)), deployed on Heroku via Docker container. The current setup has a critical limitation:

**Problem:** Heroku's ephemeral filesystem means all database content is lost on every deployment or dyno restart. This prevents adding real blog and case study content via the frontend.

**Requirements:**

1. Data survives deployments and restarts
2. Schema migrations apply without data loss
3. Backup/restore capabilities
4. Maintain GitHub integration, deployment logging, and environment config
5. Minimal code changes
6. Reasonable cost (~$5-10/month)

**Options Evaluated:**

1. Heroku + PostgreSQL ($10-12/mo) - Requires database migration
2. Heroku + Litestream ($5/mo + S3) - Adds complexity
3. **Railway + Persistent Volume ($5/mo)** - Zero code changes ✓
4. Render + Persistent Disk ($7+/mo) - Similar to Railway
5. Fly.io + Volume ($0-5/mo) - Less integrated GitHub experience

## Decision

**Migrate from Heroku to Railway** using the Hobby plan with a persistent volume for SQLite storage.

### Rationale

1. **Zero code changes required** - Existing SQLite + TypeORM setup works as-is
2. **Persistent volumes** - Data survives deployments (Heroku doesn't offer this)
3. **Usage-based pricing** - Pay only for actual compute time
4. **Serverless mode** - Service sleeps when idle, reducing costs
5. **Similar DX to Heroku** - GitHub autodeploy, logs, environment variables
6. **SQLite remains the right choice** - Single author, low write concurrency, simple data model
7. **Upgrade path to Pro** - Volume backups available if needed ($20/mo)

### Why Not PostgreSQL?

SQLite is appropriate for this use case:

- Single author (no write concurrency issues)
- Low traffic portfolio site
- Simple CRUD operations
- < 100 MB projected data size
- Single instance deployment

Switching to PostgreSQL would add cost ($5+/mo) and complexity without solving an actual problem. If scaling needs change, migration to PostgreSQL is straightforward via TypeORM.

## Consequences

### Positive

- ✅ Data persists across deployments
- ✅ No application code changes
- ✅ Automatic vertical scaling (no instance sizing)
- ✅ Lower cost potential (usage-based)
- ✅ Private networking included
- ✅ Preview environments for PRs

### Negative

- ⚠️ **Cannot use replicas with volumes** - Single instance only (acceptable)
- ⚠️ Brief deployment downtime (~seconds) due to volume remounting
- ⚠️ Hobby plan limited to single developer
- ⚠️ **No volume backups on Hobby plan** - Requires Pro ($20/mo) or manual backup strategy
- ⚠️ Younger platform than Heroku (founded 2020)
- ⚠️ Cron jobs may prevent serverless sleep (see mitigation below)

### Cron Job Consideration

The application has scheduled tasks that may prevent serverless sleep:

- `TraceService.checkDatabaseSize()` - Every 10 minutes
- `TraceService.cleanupOldTraces()` - Hourly
- `PerformanceService.cleanupOldReports()` - Daily

**Mitigation:** Accept the small always-on cost (~$5-10/mo) or optionally disable the 10-minute cron in production. The cleanup jobs are still valuable for keeping the database bounded.

---

## Migration Plan

### Pre-Migration Checklist

- [ ] Create Railway account and link GitHub
- [ ] Review current Heroku environment variables
- [ ] Document current custom domain DNS settings
- [ ] Ensure local tests pass
- [ ] Create final Heroku backup (if any valuable data exists)

### Phase 1: Railway Project Setup

**1.1 Install Railway CLI and Login**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login (opens browser)
railway login
```

**1.2 Create Project via Dashboard (Recommended)**

The easiest approach is to create the project and service via the Railway dashboard:

1. Go to [railway.com/new](https://railway.com/new)
2. Click **"Deploy from GitHub repo"**
3. Select your `profile` repository
4. Railway will auto-detect the Dockerfile and create a service

This automatically:

- Creates the project
- Creates a service linked to your repo
- Enables GitHub autodeploys
- Triggers the first build (will fail without env vars - that's ok)

**1.3 Link Local CLI to Project**

```bash
# From your repo root, link to the Railway project
railway link

# Select your project from the list
# Select the service (usually named after your repo)

# Verify the link
railway status
```

**1.4 Create `railway.toml` Configuration**

Create file at repository root (if not already created):

```toml
# railway.toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "npm run start:server:prod"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"

[[mounts]]
source = "data"
destination = "/app/data"
```

**1.5 Configure Environment Variables**

Now that the service exists, set variables via CLI:

```bash
# Required
railway variables set NODE_ENV=production
railway variables set JWT_AUTH_SECRET=<your-secret>

# Optional
railway variables set SENTRY_DSN=<your-dsn>
railway variables set TRACE_TTL_MS=86400000
railway variables set PERF_RETENTION_MS=604800000
railway variables set MAX_DB_SIZE_MB=100
```

Or via dashboard: Project → Service → Variables tab → Add variables.

### Phase 2: Deploy and Verify

**2.1 Trigger Deployment**

```bash
# If you made changes (like adding railway.toml), push to trigger autodeploy
git add railway.toml
git commit -m "chore: add Railway configuration"
git push origin master

# Or manually redeploy from CLI
railway redeploy

# Or deploy local code directly (bypasses GitHub)
railway up
```

**2.2 Verify Deployment**

```bash
# Check deployment logs
railway logs

# Check service status
railway status

# Test health endpoint
curl https://<your-app>.up.railway.app/api/health
```

**2.3 Verify Volume Persistence**

1. Create a test blog post via the frontend
2. Trigger a redeploy: `railway redeploy`
3. Verify the blog post still exists after redeploy

### Phase 3: Domain Migration

**3.1 Add Custom Domain**

```bash
# Via CLI
railway domain add reillygoulding.ca
railway domain add www.reillygoulding.ca
```

**3.2 Update DNS Records**

Railway will provide CNAME targets. Update your DNS:

| Type  | Name | Value                   |
| ----- | ---- | ----------------------- |
| CNAME | @    | `<provided-by-railway>` |
| CNAME | www  | `<provided-by-railway>` |

**3.3 Wait for DNS Propagation**

- SSL certificate auto-provisions after DNS propagates
- Check status in Railway dashboard

### Phase 4: Backup Strategy (Hobby Plan)

Railway's Hobby plan does not include volume backups. Options:

**Option A: Manual SQLite Backup via SSH (Recommended)**

```bash
# SSH into the running service
railway shell

# Inside the container, copy the database
cp /app/data/database.sqlite /app/data/database-backup-$(date +%Y%m%d).sqlite

# Or download locally via railway run
railway run cat /app/data/database.sqlite > backup.sqlite
```

**Option B: Upgrade to Pro Plan ($20/mo)**

Pro plan includes:

- Scheduled volume backups (daily/weekly/monthly)
- One-click restore
- Backup retained up to 3 months

**Option C: Application-Level Backup Endpoint**

Add a protected endpoint to export database (future enhancement).

**Current Approach:** Accept risk for now given low-value seed data. Implement manual backups before adding real content.

### Phase 5: Decommission Heroku

**5.1 Verify Railway is Stable**

- Monitor for 24-48 hours
- Check logs for errors
- Verify all features work

**5.2 Remove Heroku Resources**

```bash
# Scale down dynos
heroku ps:scale web=0 --app your-app

# Delete app (after confirming Railway works)
heroku apps:destroy your-app --confirm your-app
```

---

## Railway Configuration Reference

### Environment Variables

| Variable            | Required | Description                              |
| ------------------- | -------- | ---------------------------------------- |
| `NODE_ENV`          | Yes      | Set to `production`                      |
| `JWT_AUTH_SECRET`   | Yes      | Secret for JWT token signing             |
| `SENTRY_DSN`        | No       | Sentry error tracking DSN                |
| `TRACE_TTL_MS`      | No       | Trace retention (default: 24h)           |
| `PERF_RETENTION_MS` | No       | Performance data retention (default: 7d) |
| `MAX_DB_SIZE_MB`    | No       | DB size alert threshold (default: 100)   |
| `PORT`              | No       | Railway auto-sets this                   |

### Cost Estimate

| Component             | Estimated Monthly Cost |
| --------------------- | ---------------------- |
| Hobby plan base       | $5.00                  |
| Compute (low traffic) | Included in $5 credit  |
| Volume (1 GB)         | $0.15                  |
| **Total**             | **~$5.15/month**       |

_Note: Volume backups require Pro plan ($20/mo). Manual backups are free._

### Future Scaling Path

```
┌─────────────────────────────────────────────────────────────────┐
│  CURRENT: Railway Hobby + SQLite + Volume                       │
│  Cost: ~$5/mo | Single instance | 5GB volume limit              │
└─────────────────────────────────────────────────────────────────┘
                              │
         When needed:         │
         ─────────────────────┼─────────────────────
                              │
    ┌─────────────────────────┴─────────────────────────┐
    │                                                   │
    ▼                                                   ▼
┌───────────────────────┐                 ┌───────────────────────┐
│  Need > 5GB storage   │                 │  Need replicas/HA     │
│  or team access       │                 │  or write concurrency │
│                       │                 │                       │
│  → Upgrade to Pro     │                 │  → Switch to Railway  │
│    ($20/mo)           │                 │    PostgreSQL         │
│    1TB volume         │                 │    (one-click deploy) │
│    Unlimited seats    │                 │                       │
└───────────────────────┘                 └───────────────────────┘
```

---

## Rollback Plan

If Railway migration fails:

1. **Keep Heroku running** until Railway is verified (don't delete immediately)
2. **DNS rollback**: Point domain back to Heroku
3. **Data recovery**: Restore from manual backup or seed from scratch

---

## References

- [Railway Volumes Documentation](https://docs.railway.com/volumes)
- [Railway Volume Backups](https://docs.railway.com/volumes/backups)
- [Railway Config as Code](https://docs.railway.com/config-as-code)
- [Railway vs Heroku Comparison](https://docs.railway.com/platform/compare-to-heroku)
- [Railway CLI Reference](https://docs.railway.com/cli)
- [ADR-002: SQLite with TypeORM](./ADR-002-SQLite-TypeOrm-for-persistence.md)
