---
name: observability
description: Guide for working with Phase 2 observability features including rate limiting, visualization, alerting, and request tracing.
---

# Observability Features

Use this skill when working with the Phase 2 observability features: rate limiting, telemetry visualization, alerting, and request tracing.

## Feature Documentation

Comprehensive documentation is available in `architecture/features/phase-2-observability/`:

| Document             | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `README.md`          | User guide with visualization interpretation |
| `rate-limiting.md`   | Rate limiting architecture and extension     |
| `visualization.md`   | Recharts components and testing patterns     |
| `alerting.md`        | Alert channel architecture and extension     |
| `configuration.md`   | Environment variables reference              |
| `troubleshooting.md` | Common issues and solutions                  |

## 1. Rate Limiting

### Overview

Rate limiting uses `@nestjs/throttler` with a custom `RateLimitGuard` for per-endpoint configuration.

### Key Files

- `src/server/modules/rate-limit/rate-limiter.guard.ts` - Custom guard
- `src/server/modules/rate-limit/rate-limit.config.ts` - Per-endpoint rules
- `src/server/modules/rate-limit/rate-limit.service.ts` - Metrics tracking

### Adding New Rate Limit Rules

```typescript
// rate-limit.config.ts
export const rateLimitRules: RateLimitRule[] = [
  {
    pattern: '/api/your-endpoint',
    limit: 30,
    ttlSeconds: 60,
  },
];
```

### Testing Rate Limits

```typescript
// Integration test
it('should rate limit after threshold', async () => {
  for (let i = 0; i < limit; i++) {
    await request(app.getHttpServer()).get('/api/endpoint').expect(200);
  }
  await request(app.getHttpServer()).get('/api/endpoint').expect(429);
});
```

## 2. Visualization Components

### Overview

Telemetry visualization uses Recharts for charts and SSE for real-time updates.

### Key Components

| Component           | Purpose                | Location                                                           |
| ------------------- | ---------------------- | ------------------------------------------------------------------ |
| `TraceTrends`       | Line chart for trends  | `src/ui/containers/status/traces/components/TraceTrends.tsx`       |
| `EndpointBreakdown` | Table of top endpoints | `src/ui/containers/status/traces/components/EndpointBreakdown.tsx` |
| `AlertsPanel`       | Active alerts display  | `src/ui/containers/status/traces/components/AlertsPanel.tsx`       |
| `TraceFilters`      | Filter controls        | `src/ui/containers/status/traces/components/TraceFilters.tsx`      |

### Testing Recharts

Use the `mockRecharts` helper to mock Recharts components:

```typescript
import { mockRecharts } from 'ui/test-utils/mockRecharts';

jest.mock('recharts', () => mockRecharts);

it('should render chart', async () => {
  render(<TracesContainer />);
  await waitFor(() => {
    // ResponsiveContainer renders as a div with specific class
    expect(document.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
```

### Testing SSE Streams

Use `MockEventSource` for SSE testing:

```typescript
import { MockEventSource } from 'ui/test-utils/mockEventSource';

beforeEach(() => {
  global.EventSource = MockEventSource as unknown as typeof EventSource;
});

it('should handle SSE messages', async () => {
  render(<TracesContainer />);

  // Simulate SSE message
  MockEventSource.simulateMessage('traces', {
    type: 'trace.created',
    data: { id: 1, path: '/api/test' },
  });

  await waitFor(() => {
    expect(screen.getByText('/api/test')).toBeInTheDocument();
  });
});
```

## 3. Alerting System

### Overview

Alerts are triggered when metrics exceed thresholds. Alert channels implement the `IAlertChannel` interface.

### Key Files

- `src/server/modules/traces/trace-alert.service.ts` - Core alerting logic
- `src/server/modules/traces/channels/*.channel.ts` - Alert channels
- `src/shared/types/trace.types.ts` - Alert type definitions

### Adding New Alert Channels

1. Create channel class implementing `IAlertChannel`:

```typescript
// src/server/modules/traces/channels/slack.channel.ts
import { Injectable } from '@nestjs/common';
import { IAlertChannel, AlertPayload } from '../alert.types';

@Injectable()
export class SlackChannel implements IAlertChannel {
  readonly name = 'slack';

  async send(payload: AlertPayload): Promise<void> {
    // Implement Slack webhook call
  }

  isEnabled(): boolean {
    return !!process.env.SLACK_WEBHOOK_URL;
  }
}
```

2. Register in `TracesModule`:

```typescript
providers: [
  AlertService,
  LogChannel,
  SlackChannel, // Add new channel
],
```

3. Inject in `AlertService`:

```typescript
constructor(
  private readonly logChannel: LogChannel,
  private readonly slackChannel: SlackChannel,
) {
  this.channels = [logChannel, slackChannel];
}
```

## 4. Request Tracing

### Overview

Request tracing captures timing, status, and path information for all API requests.

### Key Files

- `src/server/modules/traces/trace.middleware.ts` - Captures request traces
- `src/server/modules/traces/traces.service.ts` - Trace storage and queries
- `src/shared/types/traces.types.ts` - Trace type definitions

### Trace Data Flow

```
Request → TraceMiddleware → TracesService.recordTrace()
        → EventEmitter.emit('trace.created') → SSE to UI
```

## 5. Testing Patterns

### Cron Job Testing

Use `cronTestUtils` for testing scheduled tasks:

```typescript
import {
  simulateCronExecution,
  parseCronExpression,
} from 'server/test-utils/cronTestUtils';

it('should validate cron expression', () => {
  const expression = '0 0 * * *'; // Daily at midnight
  const result = parseCronExpression(expression);
  expect(result.hour).toBe(0);
  expect(result.minute).toBe(0);
});

it('should run cleanup on schedule', async () => {
  await simulateCronExecution(service, 'runCleanup');
  expect(mockRepo.delete).toHaveBeenCalled();
});
```

### Integration Test Patterns

```typescript
describe('Traces Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TracesModule,
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [TraceEntity, AlertEntity],
          synchronize: true,
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should record traces', async () => {
    // Make request
    await request(app.getHttpServer()).get('/api/traces');

    // Verify trace recorded
    const traces = await request(app.getHttpServer())
      .get('/api/traces')
      .expect(200);
    expect(traces.body.length).toBeGreaterThan(0);
  });
});
```

## 6. Environment Variables

| Variable                  | Default | Description                 |
| ------------------------- | ------- | --------------------------- |
| `TRACE_RETENTION_DAYS`    | `7`     | Days to keep trace data     |
| `ALERT_COOLDOWN_MINUTES`  | `5`     | Minutes between same alerts |
| `RATE_LIMIT_GLOBAL_LIMIT` | `100`   | Default requests per window |
| `RATE_LIMIT_GLOBAL_TTL`   | `60`    | Window size in seconds      |

See `architecture/features/phase-2-observability/configuration.md` for complete reference.

## 7. Troubleshooting

### Charts Not Rendering in Tests

Mock Recharts with the `mockRecharts` helper:

```typescript
jest.mock('recharts', () => mockRecharts);
```

### SSE Connection Issues in Tests

Use `MockEventSource` instead of real EventSource:

```typescript
global.EventSource = MockEventSource as unknown as typeof EventSource;
```

### Rate Limit Not Applying

Check that:

1. The pattern matches your endpoint path
2. The guard is applied to the controller/route
3. The ThrottlerModule is imported in your module

### Alerts Not Firing

Check that:

1. Thresholds are configured correctly
2. Cooldown period hasn't blocked the alert
3. At least one channel is enabled
