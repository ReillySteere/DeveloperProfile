# ADR-013: Rate Limiting and Advanced Visualization

## Status

Accepted - January 25, 2026

## Context

Phase 1 of request tracing (ADR-010, ADR-011, ADR-012) established the foundation for
observability with trace capture, SSE streaming, and scheduled maintenance. Phase 2
extends this with three capabilities:

1. **Rate Limiting**: Protect endpoints from abuse while maintaining observability
2. **Advanced Visualization**: Trend analysis, enhanced timing breakdown, endpoint statistics
3. **Alerting**: Proactive notifications when metrics exceed thresholds

### Key Decisions Required

| Decision                | Options Considered               | Selected         |
| ----------------------- | -------------------------------- | ---------------- |
| Rate limit storage      | In-memory, SQLite, Redis         | SQLite           |
| Rate limit architecture | Shared guard, Dedicated module   | Dedicated module |
| Component strategy      | New components, Enhance existing | Enhance existing |
| Alert channels          | Sentry, Discord, Email, Slack    | Sentry + Email   |

## Decision

### 1. Rate Limiting Architecture

**Create a dedicated `RateLimitModule`** in `src/server/modules/rate-limit/` rather than
placing the guard in `src/server/shared/guards/`.

Rationale:

- Rate limiting has domain-specific logic (rules, quotas, windowing)
- Requires its own entity, repository, and service
- Follows the project's modular monolith pattern
- Easier to test in isolation with `:memory:` database

The module will export `RateLimiterGuard` for use by other modules via dependency injection.

### 2. Rate Limit Storage: SQLite

**Use SQLite** for rate limit entry storage, consistent with existing patterns:

```
┌──────────────────────────────────────────────────────────────┐
│                    RateLimitEntry Entity                      │
├───────────────────┬──────────────────────────────────────────┤
│ key (PK)          │ Composite: strategy:identifier:path      │
│ count             │ Requests in current window               │
│ windowStart       │ Unix timestamp of window start           │
│ expiresAt         │ Unix timestamp for cleanup (indexed)     │
│ createdAt         │ Unix timestamp of first request          │
└───────────────────┴──────────────────────────────────────────┘
```

Advantages over alternatives:

- **vs In-memory**: Survives restarts, shared across requests
- **vs Redis**: No additional infrastructure, sufficient for single-dyno deployment

A scheduled task will clean up expired entries hourly, similar to trace cleanup.

**Future migration path**: If scaling to multiple dynos, introduce Redis as a
drop-in replacement by implementing `IRateLimitRepository` interface (ports/adapters).

### 3. UI Component Strategy: Enhance Existing

**Extend existing components** rather than creating parallel implementations:

| Component       | Enhancement                                         |
| --------------- | --------------------------------------------------- |
| TimingWaterfall | Add `expanded` prop for detailed view with tooltips |
| TraceFilters    | Add duration range inputs (min/max ms)              |

This approach:

- Reduces code duplication
- Maintains consistent styling
- Simplifies testing (one component, multiple modes)

### 4. Alert Channels: Sentry + Email

**Support Sentry (existing) and Email** for alert notifications.

Email configuration via environment variables:

- `ALERT_EMAIL_TO` - Recipient address
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

Discord/Slack webhooks are deferred to future iterations as they require
additional secrets management and provide less value for a portfolio project.

Alerting architecture follows a channel interface pattern for extensibility:

```typescript
interface AlertChannelInterface {
  send(rule: AlertRule, stats: TraceStats): Promise<void>;
}
```

### 5. Testing Strategy

| Layer          | Approach                                          |
| -------------- | ------------------------------------------------- |
| Unit tests     | Manual DI for services and guards                 |
| Integration    | `Test.createTestingModule` with `:memory:` SQLite |
| UI Integration | Container-level tests with MSW mocking            |
| E2E            | Playwright tests for critical paths               |

E2E tests will cover:

- Rate limit enforcement (verify 429 response after threshold)
- Trend chart rendering with mock data
- Alert status display in dashboard

## Consequences

### Positive

- **Consistency**: SQLite storage aligns with existing patterns (traces, blog)
- **Simplicity**: Single database technology reduces operational complexity
- **Extensibility**: Channel interface allows future alert destinations
- **Maintainability**: Enhanced components vs duplicated components
- **Observability**: Rate limit events visible as traces (glassbox principle)

### Negative

- **SQLite limitations**: Not suitable for multi-dyno rate limiting (acceptable for portfolio)
- **Email configuration**: Requires SMTP setup for alerting (graceful degradation to Sentry/log)
- **Storage overhead**: Rate limit entries consume additional SQLite space

### Risks and Mitigations

| Risk                         | Mitigation                                   |
| ---------------------------- | -------------------------------------------- |
| SQLite contention under load | Batch writes, connection pooling             |
| Email delivery failures      | Log channel as fallback, Sentry for critical |
| Rate limit bypass attempts   | Integration tests, monitoring via traces     |

## Implementation References

- Phase 2 Documentation: [Phase 2: Observability Suite](../features/phase-2-observability/README.md)
- Rate Limit Module: `src/server/modules/rate-limit/`
- Alert Channels: `src/server/modules/traces/channels/`
- E2E Tests: `e2e/rate-limit.spec.ts`, `e2e/alerts.spec.ts`

## Related ADRs

- [ADR-010: Request Tracing](ADR-010-request-tracing-observability.md) - Foundation for Phase 2
- [ADR-011: Event-Driven Architecture](ADR-011-event-driven-architecture.md) - Alert event emission
- [ADR-012: Scheduled Tasks](ADR-012-scheduled-tasks-and-maintenance.md) - Rate limit cleanup
