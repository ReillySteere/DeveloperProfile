# Performance Observatory

## Overview

The Performance Observatory is a meta-feature that displays the portfolio site's own
performance characteristics in real-time. It demonstrates end-to-end Real User Monitoring
(RUM) implementation, data visualization, and performance budgeting.

## Architecture

### Client-Side Collection

The `PerformanceObserverService` singleton (`src/ui/shared/services/performanceObserver.ts`)
collects metrics using the [`web-vitals`](https://github.com/GoogleChrome/web-vitals) library.

**Collected Metrics:**

| Metric | Description               | Good     | Poor     |
| ------ | ------------------------- | -------- | -------- |
| LCP    | Largest Contentful Paint  | < 2500ms | > 4000ms |
| INP    | Interaction to Next Paint | < 200ms  | > 500ms  |
| CLS    | Cumulative Layout Shift   | < 0.1    | > 0.25   |
| FCP    | First Contentful Paint    | < 1800ms | > 3000ms |
| TTFB   | Time to First Byte        | < 800ms  | > 1800ms |

### Backend Module

The NestJS performance module (`src/server/modules/performance/`) provides:

- **POST `/api/performance/report`** — Receive client metrics
- **GET `/api/performance/metrics`** — Aggregated metrics with optional page/date filtering
- **GET `/api/performance/stream`** — SSE real-time metric updates
- **GET `/api/performance/benchmarks`** — Industry benchmark data
- **GET `/api/performance/bundle`** — Latest bundle analysis snapshot

### Dashboard Components

| Component             | Purpose                                                |
| --------------------- | ------------------------------------------------------ |
| `PerformanceScore`    | Overall score (0-100) based on weighted Web Vitals     |
| `WebVitalsDisplay`    | Grid of `VitalGauge` components for each metric        |
| `VitalGauge`          | Radial gauge with good/needs-improvement/poor coloring |
| `NetworkWaterfall`    | Horizontal bar chart of resource load times            |
| `MemoryChart`         | Area chart of JS heap usage over session (Chrome-only) |
| `BenchmarkComparison` | Bar chart comparing site metrics to CrUX data          |
| `BundleSizeTreemap`   | Treemap visualization of webpack bundle modules        |

### Footer Widget

The `PerformanceBadge` component displays a compact score in the site layout,
linking to the full dashboard.

## Privacy

- No PII collected (anonymous session IDs only)
- `navigator.doNotTrack` respected
- Production sampling at 10%
- Data retention: 7 days detailed, 30 days aggregated

## Related ADRs

- [ADR-024: Performance Monitoring Architecture](../decisions/ADR-024-performance-monitoring-architecture.md)
- [ADR-025: Bundle Analysis Integration](../decisions/ADR-025-bundle-analysis-integration.md)
- [ADR-006: Recharts](../decisions/ADR-006-recharts-for-telemetry-visualization.md)
- [ADR-010: Request Tracing](../decisions/ADR-010-request-tracing-observability.md)
