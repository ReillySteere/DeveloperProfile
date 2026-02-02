# Configuration Reference

All environment variables used by the Observability features.

---

## Rate Limiting

Rate limiting is configured via code in `src/server/modules/rate-limit/rate-limit.config.ts`. No environment variables are required.

To customize rules, edit `DEFAULT_RATE_LIMIT_RULES` in that file.

---

## Alerting

### Sentry Channel

| Variable     | Description             | Required | Default |
| ------------ | ----------------------- | -------- | ------- |
| `SENTRY_DSN` | Sentry Data Source Name | No       | -       |

**Example:**

```bash
SENTRY_DSN=https://abc123@sentry.io/456
```

When not set, the Sentry alert channel is disabled (alerts still go to Log channel).

### Email Channel

| Variable         | Description             | Required | Default              |
| ---------------- | ----------------------- | -------- | -------------------- |
| `SMTP_HOST`      | SMTP server hostname    | Yes\*    | -                    |
| `SMTP_PORT`      | SMTP server port        | No       | `587`                |
| `SMTP_USER`      | SMTP username/email     | Yes\*    | -                    |
| `SMTP_PASS`      | SMTP password           | Yes\*    | -                    |
| `SMTP_FROM`      | Sender email address    | No       | `alerts@example.com` |
| `ALERT_EMAIL_TO` | Recipient email address | Yes\*    | -                    |

\*Required only if you want email alerts enabled.

**Example:**

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@mycompany.com
SMTP_PASS=app-specific-password
SMTP_FROM=alerts@mycompany.com
ALERT_EMAIL_TO=oncall@mycompany.com
```

**Gmail Configuration:**

1. Enable 2FA on your Google account
2. Create an App Password at https://myaccount.google.com/apppasswords
3. Use the app password as `SMTP_PASS`

**Common SMTP Providers:**

| Provider | Host               | Port |
| -------- | ------------------ | ---- |
| Gmail    | smtp.gmail.com     | 587  |
| Outlook  | smtp.office365.com | 587  |
| SendGrid | smtp.sendgrid.net  | 587  |
| Mailgun  | smtp.mailgun.org   | 587  |

---

## Alert Rules Configuration

Alert rules are configured in `src/server/modules/traces/alert.config.ts`.

### Modifying Thresholds

Edit `defaultAlertRules`:

```typescript
export const defaultAlertRules: AlertRule[] = [
  {
    name: 'High Latency',
    metric: 'avgDuration',
    threshold: 500, // Change this value (in milliseconds)
    windowMinutes: 5,
    cooldownMinutes: 30,
    channels: ['sentry', 'log'],
    enabled: true,
  },
  // ...
];
```

### Disabling an Alert

Set `enabled: false`:

```typescript
{
  name: 'P95 Latency Spike',
  // ...
  enabled: false,  // This alert won't fire
}
```

### Adding Email to Channels

```typescript
{
  name: 'High Error Rate',
  // ...
  channels: ['sentry', 'email', 'log'],  // Add 'email'
}
```

---

## Visualization

No environment variables required. Visualization is configured via component props.

### Customizing Defaults

| Setting           | Location                           | Default  |
| ----------------- | ---------------------------------- | -------- |
| Chart time window | `TraceTrends` `hours` prop         | 24 hours |
| Endpoint limit    | `EndpointBreakdown` `limit` prop   | 10       |
| SSE buffer size   | `useTraceStream` `maxTraces` param | 100      |

**Example - Changing defaults:**

```tsx
// Show last 12 hours instead of 24
<TraceTrends hours={12} />

// Show top 20 endpoints instead of 10
<EndpointBreakdown limit={20} />
```

---

## Database

Trace data is stored in SQLite alongside other application data.

| Variable        | Description                  | Required | Default                |
| --------------- | ---------------------------- | -------- | ---------------------- |
| `DATABASE_PATH` | Path to SQLite database file | No       | `data/database.sqlite` |

---

## Full Example (.env)

```bash
# Database
DATABASE_PATH=data/database.sqlite

# Sentry (optional - for Sentry alert channel)
SENTRY_DSN=https://abc123@sentry.io/456

# Email Alerts (optional - for email alert channel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@mycompany.com
SMTP_PASS=your-app-password
SMTP_FROM=alerts@mycompany.com
ALERT_EMAIL_TO=oncall@mycompany.com
```

---

## Docker Configuration

When running in Docker, set environment variables in `docker-compose.yml`:

```yaml
services:
  app:
    build: .
    environment:
      - SENTRY_DSN=https://abc123@sentry.io/456
      - SMTP_HOST=smtp.gmail.com
      - SMTP_PORT=587
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - SMTP_FROM=${SMTP_FROM}
      - ALERT_EMAIL_TO=${ALERT_EMAIL_TO}
```

Then set secrets in `.env`:

```bash
SMTP_USER=alerts@mycompany.com
SMTP_PASS=your-app-password
SMTP_FROM=alerts@mycompany.com
ALERT_EMAIL_TO=oncall@mycompany.com
```

---

## Heroku Configuration

Set config vars:

```bash
heroku config:set SENTRY_DSN=https://abc123@sentry.io/456
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER=alerts@mycompany.com
heroku config:set SMTP_PASS=your-app-password
heroku config:set SMTP_FROM=alerts@mycompany.com
heroku config:set ALERT_EMAIL_TO=oncall@mycompany.com
```

---

## Validation

To verify your configuration:

1. **Check Sentry:** Look for test events in Sentry dashboard after triggering a high-latency request

2. **Check Email:** Temporarily lower the threshold to trigger an alert:

   ```typescript
   threshold: 1,  // 1ms - will trigger immediately
   ```

3. **Check Logs:** All alerts go to the log channel by default. Look for:
   ```
   [LogAlertChannel] ALERT: High Latency - avgDuration: 750.00ms (threshold: 500)
   ```
