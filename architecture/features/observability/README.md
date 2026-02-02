# Observability Suite

## Overview

The Observability Suite extends the request tracing system with three major capabilities:

1. **Rate Limiting** - Protect APIs from abuse with configurable per-endpoint and per-user limits
2. **Advanced Visualization** - Interactive charts showing request trends, endpoint performance, and timing analysis
3. **Alerting** - Automated threshold monitoring with multi-channel notifications

**Route:** `/status/traces`

---

## Quick Start

### Accessing the Dashboard

Navigate to **Status → Traces** in the application. The dashboard displays:

- Real-time request stream (SSE)
- Request trend charts
- Endpoint performance breakdown
- Active alerts panel

### Understanding the Visualizations

#### Request Trends Chart

The line chart in the "Request Trends" panel shows:

| Line             | Color  | Meaning                                                                                     |
| ---------------- | ------ | ------------------------------------------------------------------------------------------- |
| **Avg Duration** | Purple | Average response time in milliseconds. A rising trend indicates degrading performance.      |
| **P95 Duration** | Blue   | 95th percentile latency. Represents worst-case user experience. Should stay under 1 second. |
| **Error Rate**   | Orange | Percentage of requests returning 4xx/5xx status codes. Healthy systems stay under 1%.       |

**How to Interpret:**

- **Spikes** in Avg Duration may indicate database slowdowns, external API issues, or resource contention
- **Gradual increases** suggest memory leaks or accumulating technical debt
- **Correlated error spikes** with latency often indicate timeout-related failures

#### Endpoint Breakdown Table

The "Top Endpoints" panel shows per-route metrics:

| Column          | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| **Method**      | HTTP method (GET, POST, etc.). Color-coded for quick scanning.     |
| **Path**        | API endpoint path. Patterns like `/api/blog/:slug` are normalized. |
| **Requests**    | Total request count. Bar width shows relative traffic volume.      |
| **Avg Latency** | Mean response time. Red highlight if > 500ms.                      |
| **Errors**      | Error percentage. Red highlight if > 5%.                           |

**How to Interpret:**

- **High-traffic endpoints** with high latency are optimization priorities
- **Low-traffic endpoints** with high error rates may have bugs in edge cases
- **POST/PUT/DELETE** endpoints with high latency may need async processing

#### Timing Waterfall

When viewing a trace detail, the timing waterfall shows request phases:

| Phase                  | Description                                      |
| ---------------------- | ------------------------------------------------ |
| **Interceptor (Pre)**  | Time before handler execution (auth, validation) |
| **Handler**            | Business logic execution time                    |
| **Interceptor (Post)** | Response transformation time                     |

**How to Interpret:**

- **Long Pre-Interceptor** → Auth or validation is slow
- **Long Handler** → Database queries or business logic needs optimization
- **Long Post-Interceptor** → Response serialization or logging overhead

Click on phases (in expanded mode) to see detailed breakdowns and slow-phase highlighting (> 100ms).

#### Active Alerts Panel

The "Active Alerts" panel shows unresolved alerts:

| Element            | Meaning                                     |
| ------------------ | ------------------------------------------- |
| **Badge count**    | Number of active alerts                     |
| **Alert name**     | Which rule triggered (e.g., "High Latency") |
| **Time ago**       | When the alert was triggered                |
| **Metric value**   | Actual value that exceeded threshold        |
| **Threshold**      | Configured limit that was breached          |
| **Resolve button** | Mark alert as resolved (acknowledged)       |

**How to Interpret:**

- **Multiple alerts** for the same rule indicate ongoing issues (alerts have a 30-60 min cooldown)
- **Resolve** an alert after you've investigated and addressed the root cause
- Resolved alerts are stored in history for audit purposes

---

## Rate Limiting

### How It Works

Every API request passes through the `RateLimiterGuard`:

```
Request → RateLimiterGuard → Handler
              ↓
         Check limit key
         (IP or User ID)
              ↓
         Count within window?
              ↓
         Yes → Proceed
         No  → 429 Too Many Requests
```

### Default Limits

| Endpoint             | Window | Max Requests | Strategy |
| -------------------- | ------ | ------------ | -------- |
| `/api/auth/login`    | 1 min  | 5            | Per IP   |
| `/api/auth/register` | 1 hour | 3            | Per IP   |
| `/api/blog` (writes) | 1 min  | 10           | Per User |
| `/api/**` (fallback) | 1 min  | 100          | Per IP   |

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706187600
```

### When You're Rate Limited

If you exceed the limit, you'll receive:

```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "retryAfter": "2025-01-25T10:15:00.000Z"
}
```

Wait until the `retryAfter` time before making more requests.

---

## Alerting

### How It Works

The `TraceAlertService` runs every minute via a cron job:

```
Cron (every minute)
        ↓
   Evaluate each alert rule
        ↓
   Calculate metric for window (e.g., last 5 minutes)
        ↓
   Threshold exceeded?
        ↓
   Yes → Check cooldown → Send to channels
   No  → Skip
```

### Default Alert Rules

| Alert             | Metric      | Threshold | Window | Cooldown |
| ----------------- | ----------- | --------- | ------ | -------- |
| High Latency      | avgDuration | 500ms     | 5 min  | 30 min   |
| High Error Rate   | errorRate   | 5%        | 5 min  | 30 min   |
| P95 Latency Spike | p95Duration | 1000ms    | 5 min  | 60 min   |

### Alert Channels

| Channel    | Description                         | Configuration Required                |
| ---------- | ----------------------------------- | ------------------------------------- |
| **Sentry** | Sends as Sentry event with severity | `SENTRY_DSN` env var                  |
| **Email**  | SMTP email notification             | `SMTP_*` env vars (see Configuration) |
| **Log**    | Logs to application output          | Always enabled                        |

### Resolving Alerts

1. Click **Resolve** in the Active Alerts panel
2. Optionally add resolution notes (via API)
3. Alert moves to resolved state with timestamp

---

## Related Documentation

- [Configuration Reference](./configuration.md) - All environment variables
- [Rate Limiting Architecture](./rate-limiting.md) - Technical deep-dive
- [Visualization Architecture](./visualization.md) - Chart implementation details
- [Alerting Architecture](./alerting.md) - Channel and cron patterns
- [Troubleshooting Guide](./troubleshooting.md) - Common issues and solutions

---

## For Developers

See the architecture documents for:

- How to add a new rate limit rule
- How to create a new visualization chart
- How to implement a new alert channel
- Testing patterns for cron jobs, SSE, and Recharts
