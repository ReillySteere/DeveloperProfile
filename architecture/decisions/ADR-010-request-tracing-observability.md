# ADR-010: Request Tracing & Observability Dashboard

## Status

Accepted - January 24, 2026

## Context

The Mission Control Telemetry Dashboard (ADR-006, ADR-007) provides real-time system
metrics (event loop lag, memory, database latency). However, it lacks visibility into
individual API requests—a critical capability for debugging production issues and
understanding application behavior.

Modern observability platforms like Datadog, New Relic, and Jaeger provide distributed
tracing. For this portfolio project, we need a lightweight, self-contained solution that:

1. **Captures request telemetry**: Method, path, status, duration, timing breakdown
2. **Provides historical access**: Query past traces with filtering
3. **Streams in real-time**: SSE endpoint for live request monitoring
4. **Requires no external services**: Runs entirely within the existing infrastructure

### Alternatives Considered

| Approach               | Pros                            | Cons                                   |
| ---------------------- | ------------------------------- | -------------------------------------- |
| External APM (Datadog) | Full-featured, production-ready | Cost, external dependency, overkill    |
| OpenTelemetry + Jaeger | Standard, distributed           | Complex setup, requires Jaeger backend |
| Custom in-app tracing  | Simple, self-contained          | Limited features, maintenance burden   |

## Decision

We will implement **custom in-app request tracing** with the following architecture:

### 1. Global Interceptor

A NestJS interceptor (`TracingInterceptor`) captures all API requests:

- Generates or propagates trace IDs (`X-Trace-Id` header)
- Measures total duration using `performance.now()`
- Records timing phases (interceptor pre/post, handler)
- Captures metadata (user agent, IP, authenticated user ID)

### 2. Trace Storage

Traces are persisted to SQLite via TypeORM:

- Entity: `RequestTrace` with indexed columns for efficient querying
- Repository: `TraceRepository` implementing `ITraceRepository` interface
- TTL: 24-hour default retention with hourly cleanup job

### 3. Real-Time Streaming

New traces are emitted via EventEmitter2 and streamed to clients:

- Event: `trace.created` emitted after each trace is recorded
- SSE endpoint: `GET /api/traces/stream` using RxJS `fromEvent()`

### 4. Query API

REST endpoints for historical trace access:

- `GET /api/traces` - List with filters (method, path, status, duration range)
- `GET /api/traces/:traceId` - Single trace detail
- `GET /api/traces/stats` - Aggregated statistics (count, avg duration, error rate)

## Consequences

### Positive

- **Self-contained**: No external services or additional infrastructure required
- **Demonstrates patterns**: Showcases interceptors, event-driven architecture, SSE
- **Production-like**: Similar patterns to real APM systems at smaller scale
- **Extensible**: Foundation for rate limiting, alerting, and advanced analytics

### Negative

- **Storage overhead**: Traces consume SQLite space (mitigated by TTL cleanup)
- **Performance impact**: Each request incurs tracing overhead (~1-2ms)
- **Limited scope**: Single-service tracing only (no distributed trace correlation)

## Implementation Notes

### Excluded Paths

The following paths are excluded from tracing to prevent noise and recursion:

- `/api/health` - Health checks would flood the trace store
- `/api/traces/stream` - SSE endpoint would trace itself recursively

### Timing Breakdown

The timing breakdown captures phases of request processing:

```
┌─────────────────────────────────────────────────────────────┐
│                      Total Duration                          │
├───────────┬────────┬───────────┬──────────┬────────────────┤
│ Middleware│ Guard  │Interceptor│ Handler  │ Interceptor    │
│   (pre)   │        │   (pre)   │          │    (post)      │
└───────────┴────────┴───────────┴──────────┴────────────────┘
```

Currently, only interceptor and handler phases are instrumented. Middleware and
guard timing would require additional instrumentation.

## Related Documentation

- [Component: Traces](../components/traces.md)
- [ADR-011: Event-Driven Architecture](ADR-011-event-driven-architecture.md)
- [ADR-012: Scheduled Tasks](ADR-012-scheduled-tasks-and-maintenance.md)
