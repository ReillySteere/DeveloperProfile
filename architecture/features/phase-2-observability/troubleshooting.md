# Troubleshooting Guide

Common issues and solutions for the Phase 2 Observability features.

---

## Rate Limiting

### "429 Too Many Requests" on legitimate traffic

**Symptoms:**

- Users receiving 429 errors during normal usage
- Rate limit headers showing 0 remaining

**Causes & Solutions:**

| Cause               | Solution                                               |
| ------------------- | ------------------------------------------------------ |
| Threshold too low   | Increase `maxRequests` in the rule                     |
| Wrong key strategy  | Use `user` instead of `ip` for authenticated endpoints |
| Shared IP (NAT/VPN) | Consider `user` or `ip+user` strategy                  |
| Bot/crawler traffic | Keep limits, or add crawler detection                  |

**How to diagnose:**

1. Check the `X-RateLimit-*` response headers
2. Look at traces dashboard for 429 status codes
3. Review `rate-limit.config.ts` for matching rule

### Rate limits not being applied

**Symptoms:**

- No `X-RateLimit-*` headers on responses
- Unlimited requests allowed

**Causes & Solutions:**

| Cause                | Solution                                 |
| -------------------- | ---------------------------------------- |
| Path excluded        | Check `RATE_LIMIT_EXCLUDED_PATHS`        |
| No matching rule     | Add a rule for the path                  |
| Guard not registered | Verify `APP_GUARD` provider in module    |
| Rule pattern wrong   | Test pattern with `matchPath()` function |

**How to diagnose:**

```typescript
import { matchPath } from './rate-limit.config';
console.log(matchPath('/api/**', '/api/blog')); // Should be true
```

### Rate limit counts not persisting

**Symptoms:**

- Counts reset unexpectedly
- Different counts on page refresh

**Causes & Solutions:**

| Cause          | Solution                            |
| -------------- | ----------------------------------- |
| Server restart | Expected - counts persist in SQLite |
| Window expired | Check `windowMs` configuration      |
| Database issue | Check SQLite file permissions       |

---

## Visualizations

### Charts not loading / showing "Loading..."

**Symptoms:**

- Perpetual loading state
- No chart rendered

**Causes & Solutions:**

| Cause               | Solution                                |
| ------------------- | --------------------------------------- |
| Backend not running | Start server with `npm start`           |
| Network error       | Check browser DevTools Network tab      |
| No data available   | Wait for some requests to generate data |
| Query error         | Check React Query DevTools for errors   |

**How to diagnose:**

1. Open browser DevTools → Network tab
2. Look for `/api/traces/stats/hourly` request
3. Check response status and body

### Charts showing wrong time range

**Symptoms:**

- Data appears stale
- Time labels don't match current time

**Causes & Solutions:**

| Cause             | Solution                            |
| ----------------- | ----------------------------------- |
| Timezone mismatch | Check server timezone vs browser    |
| Cache stale       | Manually invalidate query cache     |
| Hour aggregation  | Data aggregates by hour, not minute |

### SSE stream disconnecting

**Symptoms:**

- Live traces stop updating
- "Disconnected" connection state

**Causes & Solutions:**

| Cause                | Solution                            |
| -------------------- | ----------------------------------- |
| Server restart       | Reconnect automatically or manually |
| Proxy timeout        | Increase proxy timeout (see below)  |
| Browser tab inactive | Reconnects when tab active          |

**Proxy configuration (nginx):**

```nginx
location /api/traces/stream {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_buffering off;
    proxy_read_timeout 86400s;  # 24 hours
}
```

### Endpoint breakdown showing normalized paths

**Symptoms:**

- Paths like `/api/blog/:slug` instead of `/api/blog/my-post`

**Explanation:** This is intentional. Paths are normalized to group similar routes together. Dynamic segments (`:id`, `:slug`) are replaced with placeholders.

---

## Alerting

### Alerts not firing when expected

**Symptoms:**

- Threshold exceeded but no alert
- Alert history empty

**Causes & Solutions:**

| Cause                  | Solution                             |
| ---------------------- | ------------------------------------ |
| Rule disabled          | Check `enabled: true` in rule config |
| In cooldown            | Wait for cooldown to expire          |
| Metric below threshold | Verify metric calculation            |
| Cron not running       | Ensure `ScheduleModule` is imported  |

**How to diagnose:**

1. Check logs for `TraceAlertService: Alert triggered` or `Error evaluating rule`
2. Call `checkAlerts()` manually in a test
3. Lower threshold temporarily to verify firing

### Email alerts not sending

**Symptoms:**

- Log shows alert triggered
- No email received

**Causes & Solutions:**

| Cause                   | Solution                                 |
| ----------------------- | ---------------------------------------- |
| SMTP not configured     | Set all `SMTP_*` env vars                |
| Wrong credentials       | Test SMTP credentials separately         |
| Email in spam           | Check spam folder                        |
| 'email' not in channels | Add `'email'` to rule's `channels` array |
| Firewall blocking       | Allow outbound on SMTP port              |

**How to diagnose:**

1. Check logs for `EmailAlertChannel: Sent alert email` or `Failed to send`
2. Test SMTP connection:
   ```bash
   telnet smtp.gmail.com 587
   ```
3. Use a service like [Mailtrap](https://mailtrap.io) for testing

### Sentry alerts not appearing

**Symptoms:**

- Log shows alert triggered
- Nothing in Sentry dashboard

**Causes & Solutions:**

| Cause                    | Solution                                  |
| ------------------------ | ----------------------------------------- |
| `SENTRY_DSN` not set     | Set environment variable                  |
| Wrong DSN                | Verify DSN in Sentry project settings     |
| 'sentry' not in channels | Add `'sentry'` to rule's `channels` array |
| Sentry rate limited      | Check Sentry quota                        |
| Wrong environment filter | Check Sentry environment filter           |

### Alerts firing too frequently (spam)

**Symptoms:**

- Same alert firing repeatedly
- Email inbox flooded

**Causes & Solutions:**

| Cause                         | Solution                             |
| ----------------------------- | ------------------------------------ |
| Cooldown too short            | Increase `cooldownMinutes`           |
| Multiple rules for same issue | Consolidate rules                    |
| Persistent issue              | Fix the underlying performance issue |

### Old alerts not clearing

**Symptoms:**

- Dashboard shows resolved alerts
- Alert count includes old items

**Explanation:** The "Active Alerts" panel only shows unresolved alerts. If you're seeing resolved alerts, check the API endpoint you're calling.

**To clear all alerts:**

```sql
UPDATE alert_history SET resolved = 1, resolvedAt = datetime('now') WHERE resolved = 0;
```

---

## Database Issues

### SQLite "database is locked"

**Symptoms:**

- Timeout errors
- Writes failing

**Causes & Solutions:**

| Cause                 | Solution                                      |
| --------------------- | --------------------------------------------- |
| Multiple writers      | SQLite is single-writer; expected during load |
| Long transaction      | Reduce transaction scope                      |
| Connection not closed | Check connection pooling                      |

**Mitigation:**

```typescript
// In TypeORM config
{
  extra: {
    busyTimeout: 5000, // Wait 5s for lock
  },
}
```

### Database file growing too large

**Symptoms:**

- Slow queries
- Disk space warnings

**Causes & Solutions:**

| Cause              | Solution                       |
| ------------------ | ------------------------------ |
| Too many traces    | Reduce retention (see ADR-012) |
| Rate limit entries | Cleanup job runs hourly        |
| Alert history      | Consider archiving old records |

**Check size:**

```sql
SELECT
  name,
  SUM(pgsize) as size_bytes
FROM dbstat
GROUP BY name
ORDER BY size_bytes DESC;
```

---

## Performance Issues

### Slow chart rendering

**Symptoms:**

- Charts take > 100ms to render
- Browser janky during scroll

**Causes & Solutions:**

| Cause                | Solution                     |
| -------------------- | ---------------------------- |
| Too many data points | Reduce `hours` parameter     |
| Re-renders           | Memoize data transformations |
| Large DOM            | Virtualize if needed         |

### High memory usage

**Symptoms:**

- Memory climbing over time
- Browser tab crashes

**Causes & Solutions:**

| Cause                 | Solution                              |
| --------------------- | ------------------------------------- |
| SSE buffer too large  | Reduce `maxTraces` parameter          |
| Query cache unbounded | Configure TanStack Query cache limits |
| Memory leaks          | Check useEffect cleanup               |

---

## Testing Issues

### Recharts tests failing

**Error:** `TypeError: Cannot read properties of undefined (reading 'width')`

**Solution:** Mock `ResponsiveContainer`:

```typescript
jest.mock('recharts', () => ({
  ...jest.requireActual('recharts'),
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div style={{ width: 800, height: 400 }}>{children}</div>
  ),
}));
```

### SSE tests timing out

**Error:** Test times out waiting for connection

**Solution:** Use mock EventSource (see [visualization.md](./visualization.md#testing-sse-streams))

### Cron tests not triggering

**Error:** `@Cron` decorated method not called

**Solution:** Call the method directly in tests:

```typescript
await service.checkAlerts(); // Don't wait for cron
```

---

## Getting Help

If your issue isn't listed here:

1. **Check logs:** Server logs often contain detailed error messages
2. **Check browser DevTools:** Network tab for API errors, Console for JS errors
3. **Check traces:** The traces dashboard may show relevant requests
4. **Search issues:** Check GitHub issues for similar problems
5. **Ask for help:** Open a new issue with reproduction steps
