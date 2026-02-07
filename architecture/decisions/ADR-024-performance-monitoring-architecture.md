# ADR-024: Performance Monitoring Architecture

## Status

Accepted - February 7, 2026

## Context

The Performance Observatory feature requires decisions about how to collect, store, and display
real-time performance metrics from the client-side. This is a "meta-feature" — the portfolio site
displays its own performance characteristics, demonstrating performance monitoring mastery.

### Key Questions

1. **Client-side collection**: Custom `PerformanceObserver` vs `web-vitals` library?
2. **Metric storage**: Same database or separate analytics store?
3. **Real-time streaming**: SSE vs polling vs WebSockets?
4. **Privacy**: What data to collect and how to anonymize?

## Decision

### 1. Use `web-vitals` library for client-side collection

The [`web-vitals`](https://github.com/GoogleChrome/web-vitals) library is maintained by Google's
Chrome team and implements the standard Core Web Vitals API. It provides:

- Standardized metric collection (LCP, INP, CLS, FCP, TTFB)
- Proper attribution and rating calculation
- Tiny bundle size (~1.5KB gzipped)
- Automatic handling of edge cases (back/forward cache, prerender)

**Alternative considered**: Custom `PerformanceObserver` wrappers. Rejected because the
web-vitals library already handles all the edge cases and provides consistent cross-browser behavior.

### 2. Store in same SQLite database with TTL cleanup

Performance reports are stored in the existing SQLite database alongside other application data.
A scheduled cleanup job runs daily to remove reports older than the retention period.

- **Development**: 24-hour retention
- **Production**: 7 days detailed, 30 days aggregated

**Alternative considered**: Separate analytics database or external service (e.g., Google Analytics).
Rejected to keep the portfolio self-contained and demonstrate the full monitoring stack.

### 3. SSE for real-time updates

Server-Sent Events (SSE) is used for real-time metric streaming, consistent with the existing
trace infrastructure (ADR-010). This provides:

- Unidirectional server-to-client streaming
- Automatic reconnection
- Simpler implementation than WebSockets
- Consistency with existing patterns

### 4. Privacy-first data collection

- **No PII collected**: Only anonymous session IDs (random, not tied to users)
- **Respect Do Not Track**: Check `navigator.doNotTrack` before reporting
- **Data minimization**: Only collect necessary metrics
- **Production sampling**: 10% sampling rate to avoid overwhelming the database

## Consequences

### Positive

- Standardized metrics from Google's own library
- Consistent SSE pattern with existing observability features
- Self-contained system (no external dependencies)
- Privacy-respecting by default

### Negative

- Additional database tables and storage requirements
- Bundle size increase (~1.5KB gzipped for web-vitals)
- Memory API is Chrome-only (graceful degradation required)

## References

- [Web Vitals Library](https://github.com/GoogleChrome/web-vitals)
- [ADR-010: Request Tracing](./ADR-010-request-tracing-observability.md)
- [ADR-011: Event-Driven Architecture](./ADR-011-event-driven-architecture.md)
- [ADR-012: Scheduled Tasks](./ADR-012-scheduled-tasks-and-maintenance.md)
