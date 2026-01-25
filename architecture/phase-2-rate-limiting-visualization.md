# Request Tracing Phase 2: Rate Limiting & Visualization

## Overview

This document outlines the implementation plan for Phase 2 enhancements to the Request Tracing feature, focusing on rate limiting controls and advanced visualization capabilities.

**Prerequisites:** Phase 1 (ADR-010, ADR-011, ADR-012) must be complete.

## Goals

1. **Rate Limiting**: Per-endpoint and per-user rate limiting with trace integration
2. **Advanced Visualization**: Interactive timing analysis, trend charts, and anomaly highlighting
3. **Alerting**: Configurable thresholds for latency and error rate alerts

---

## Part 1: Rate Limiting

### 1.1 Requirements

| Requirement          | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| Per-endpoint limits  | Configure limits per API path (e.g., `/api/blog` = 100 req/min) |
| Per-user limits      | Authenticated users have separate quotas                        |
| Trace integration    | Rate limit events recorded as traces with special status        |
| Dashboard visibility | Show rate limit status in Mission Control                       |

### 1.2 Technical Design

#### Rate Limiter Guard

```typescript
// src/server/shared/guards/rate-limiter.guard.ts
@Injectable()
export class RateLimiterGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly traceService: TraceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request);

    const result = await this.rateLimitService.checkLimit(key);

    if (!result.allowed) {
      // Record as trace with 429 status
      await this.traceService.recordRateLimitHit(request, result);
      throw new TooManyRequestsException({
        retryAfter: result.resetAt,
        remaining: 0,
      });
    }

    return true;
  }
}
```

#### Rate Limit Configuration

```typescript
// src/server/modules/rate-limit/rate-limit.config.ts
export interface RateLimitRule {
  path: string; // Glob pattern (e.g., '/api/blog/*')
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyStrategy: 'ip' | 'user' | 'ip+user';
}

export const defaultRules: RateLimitRule[] = [
  {
    path: '/api/auth/login',
    windowMs: 60000,
    maxRequests: 5,
    keyStrategy: 'ip',
  },
  { path: '/api/blog', windowMs: 60000, maxRequests: 100, keyStrategy: 'user' },
  { path: '/api/**', windowMs: 60000, maxRequests: 1000, keyStrategy: 'ip' },
];
```

#### Storage Backend

```typescript
// src/server/modules/rate-limit/rate-limit.repository.ts
interface RateLimitEntry {
  key: string;
  count: number;
  windowStart: number;
  expiresAt: number;
}

// Option 1: In-memory (single dyno)
// Option 2: SQLite table (multi-request persistence)
// Option 3: Redis (if scaling to multiple dynos - future)
```

### 1.3 Implementation Tasks

| Task                                              | Estimate | Dependencies     |
| ------------------------------------------------- | -------- | ---------------- |
| Create `RateLimitModule` scaffold                 | 2h       | None             |
| Implement `RateLimitService` with in-memory store | 4h       | Module           |
| Implement `RateLimiterGuard`                      | 3h       | Service          |
| Integrate with `TracingInterceptor`               | 2h       | Guard            |
| Add rate limit headers (`X-RateLimit-*`)          | 1h       | Guard            |
| Create admin endpoint for rule management         | 3h       | Service          |
| Write unit and integration tests                  | 4h       | All above        |
| Update traces UI to show rate limit events        | 3h       | Backend complete |

**Total Estimate:** ~22 hours

---

## Part 2: Advanced Visualization

### 2.1 Requirements

| Requirement          | Description                                      |
| -------------------- | ------------------------------------------------ |
| Timing waterfall     | Interactive breakdown of request phases          |
| Trend charts         | Line charts showing latency/error rate over time |
| Anomaly highlighting | Visual indicators for slow/failed requests       |
| Filtering UI         | Advanced filter builder for complex queries      |

### 2.2 Technical Design

#### Timing Waterfall Component

```tsx
// src/ui/containers/status/traces/components/TimingWaterfallDetailed.tsx
interface WaterfallProps {
  trace: RequestTrace;
  expanded?: boolean;
}

export const TimingWaterfallDetailed: React.FC<WaterfallProps> = ({
  trace,
}) => {
  const phases = [
    { name: 'Middleware', duration: trace.timing.middleware, color: '#8884d8' },
    { name: 'Guard', duration: trace.timing.guard, color: '#82ca9d' },
    {
      name: 'Interceptor (Pre)',
      duration: trace.timing.interceptorPre,
      color: '#ffc658',
    },
    { name: 'Handler', duration: trace.timing.handler, color: '#ff7300' },
    {
      name: 'Interceptor (Post)',
      duration: trace.timing.interceptorPost,
      color: '#00C49F',
    },
  ];

  return (
    <div className={styles.waterfall}>
      {phases.map((phase) => (
        <WaterfallBar
          key={phase.name}
          name={phase.name}
          duration={phase.duration}
          percentage={(phase.duration / trace.durationMs) * 100}
          color={phase.color}
        />
      ))}
    </div>
  );
};
```

#### Trend Charts

```tsx
// src/ui/containers/status/traces/components/TraceTrends.tsx
export const TraceTrends: React.FC = () => {
  const { data: hourlyStats } = useTraceHourlyStats();

  return (
    <div className={styles.trends}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={hourlyStats}>
          <XAxis dataKey="hour" />
          <YAxis yAxisId="latency" orientation="left" />
          <YAxis yAxisId="errors" orientation="right" />
          <Line
            yAxisId="latency"
            dataKey="avgDuration"
            stroke="#8884d8"
            name="Avg Latency"
          />
          <Line
            yAxisId="errors"
            dataKey="errorRate"
            stroke="#ff7300"
            name="Error Rate"
          />
          <Tooltip />
          <Legend />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

#### New API Endpoints

```typescript
// GET /api/traces/stats/hourly
interface HourlyStats {
  hour: string; // ISO timestamp
  count: number;
  avgDuration: number;
  errorRate: number;
  p95Duration: number;
}

// GET /api/traces/stats/endpoints
interface EndpointStats {
  path: string;
  method: string;
  count: number;
  avgDuration: number;
  errorRate: number;
}
```

### 2.3 Implementation Tasks

| Task                                          | Estimate | Dependencies |
| --------------------------------------------- | -------- | ------------ |
| Add `getHourlyStats()` to repository          | 3h       | None         |
| Add `getEndpointStats()` to repository        | 2h       | None         |
| Create `/api/traces/stats/hourly` endpoint    | 2h       | Repository   |
| Create `/api/traces/stats/endpoints` endpoint | 2h       | Repository   |
| Implement `TraceTrends` component             | 4h       | API          |
| Implement `TimingWaterfallDetailed` component | 3h       | None         |
| Implement `EndpointBreakdown` component       | 3h       | API          |
| Implement `AdvancedFilters` component         | 4h       | None         |
| Write frontend integration tests              | 4h       | Components   |
| Write backend integration tests               | 3h       | API          |

**Total Estimate:** ~30 hours

---

## Part 3: Alerting

### 3.1 Requirements

| Requirement          | Description                                     |
| -------------------- | ----------------------------------------------- |
| Latency threshold    | Alert when avg latency exceeds threshold        |
| Error rate threshold | Alert when error rate exceeds threshold         |
| Cooldown period      | Prevent alert spam with minimum interval        |
| Multi-channel        | Support Sentry, Discord webhook, email (future) |

### 3.2 Technical Design

#### Alert Configuration

```typescript
// src/server/modules/traces/alert.config.ts
export interface AlertRule {
  name: string;
  metric: 'avgDuration' | 'errorRate' | 'p95Duration';
  threshold: number;
  windowMinutes: number;
  cooldownMinutes: number;
  channels: ('sentry' | 'discord' | 'log')[];
}

export const defaultAlertRules: AlertRule[] = [
  {
    name: 'High Latency',
    metric: 'avgDuration',
    threshold: 500, // 500ms
    windowMinutes: 5,
    cooldownMinutes: 30,
    channels: ['sentry', 'log'],
  },
  {
    name: 'High Error Rate',
    metric: 'errorRate',
    threshold: 5, // 5%
    windowMinutes: 5,
    cooldownMinutes: 30,
    channels: ['sentry', 'log'],
  },
];
```

#### Alert Service

```typescript
// src/server/modules/traces/trace-alert.service.ts
@Injectable()
export class TraceAlertService {
  private readonly cooldowns = new Map<string, number>();

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAlerts(): Promise<void> {
    const stats = await this.traceService.getRecentStats(5); // Last 5 minutes

    for (const rule of this.alertRules) {
      if (this.shouldAlert(rule, stats)) {
        await this.sendAlert(rule, stats);
        this.setCooldown(rule.name);
      }
    }
  }
}
```

### 3.3 Implementation Tasks

| Task                              | Estimate | Dependencies |
| --------------------------------- | -------- | ------------ |
| Create `TraceAlertService`        | 4h       | None         |
| Implement Sentry channel          | 2h       | Service      |
| Implement Discord webhook channel | 3h       | Service      |
| Add `getRecentStats()` method     | 2h       | Repository   |
| Create alert history table        | 2h       | None         |
| Add alert management API          | 3h       | Service      |
| Write unit tests                  | 3h       | All above    |
| Add alert status to dashboard     | 2h       | API          |

**Total Estimate:** ~21 hours

---

## Implementation Schedule

### Sprint 1 (Week 1-2): Rate Limiting

- Set up module structure
- Implement core rate limiting logic
- Integrate with existing tracing

### Sprint 2 (Week 3-4): Visualization

- Build trend charts
- Enhance timing waterfall
- Implement advanced filters

### Sprint 3 (Week 5): Alerting

- Implement alert service
- Add Sentry/Discord channels
- Dashboard integration

### Sprint 4 (Week 6): Polish & Testing

- E2E tests for all new features
- Performance optimization
- Documentation updates

---

## Success Metrics

| Metric              | Target                           |
| ------------------- | -------------------------------- |
| Rate limit accuracy | < 1% false positives             |
| Chart render time   | < 100ms for 1000 data points     |
| Alert latency       | < 1 minute from threshold breach |
| Test coverage       | 100% on new code                 |

---

## Future Considerations

1. **Redis integration**: For multi-dyno rate limiting
2. **Sampling**: Reduce storage for high-traffic endpoints
3. **Distributed tracing**: Correlation with external services
4. **Custom dashboards**: User-configurable metric panels
5. **Export**: CSV/JSON export of trace data
