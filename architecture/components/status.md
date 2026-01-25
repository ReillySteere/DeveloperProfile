# Status (Mission Control) Feature Architecture

## Overview

The Status feature provides a real-time telemetry dashboard ("Mission Control") displaying system health metrics via Server-Sent Events (SSE). It demonstrates production observability patterns and includes a simulated chaos mode for interactive demonstrations.

**Route:** `/status`

## Purpose

This feature serves dual purposes:

1. **Operational Transparency:** Expose internal system state (event loop health, memory usage, database latency) to demonstrate observability practices.
2. **Technical Demonstration:** Showcase staff-level engineering competencies including Node.js internals, real-time streaming, and chaos engineering principles.

## Data Flow

### 1. Backend Metrics Collection (NestJS)

- **Module:** `HealthModule` (extended)
- **Controller:** `SseController` (`/api/health/stream`)
  - SSE endpoint using RxJS Observables
  - Accepts `?chaos=cpu,memory` query parameters for simulation
- **Service:** `MetricsService`
  - Collects real metrics every second:
    - **Event Loop Lag:** Via `perf_hooks.monitorEventLoopDelay()`
    - **Memory:** V8 heap and RSS via `process.memoryUsage()`
    - **Database Latency:** Timed `SELECT 1` query
    - **Process Info:** PID, Node version, uptime
  - Provides `applyChaosSim()` for production-safe chaos simulation

### 2. Real-Time Streaming (SSE)

- **Protocol:** Server-Sent Events (not WebSocket)
- **Rationale:** One-way data flow, simpler than WebSocket, works through HTTP proxies, natural backpressure
- **Interval:** 1 second between emissions
- **Reconnection:** Client auto-reconnects after 3 seconds on error

### 3. Frontend Data Layer (React + TanStack)

- **Hook:** `useServerEventSource` (`src/ui/containers/status/hooks/`)
  - Manages `EventSource` lifecycle
  - Maintains sliding window buffer (60 data points = 60 seconds)
  - Handles connection state machine: `connecting` → `connected` → `error` → `reconnecting`
  - Passes chaos flags via query parameters

### 4. User Interface (React)

- **Page:** `StatusContainer` (`src/ui/containers/status/status.container.tsx`)
  - **Layout:** Uses `Frame` for consistent page structure
- **Components:**
  - `TelemetryCharts`: Real-time line charts (event loop lag, memory) using recharts
  - `VisualHeartbeat`: Animated pulse indicator synced to event loop lag
  - `LatencyChain`: Visual representation of Client → Server → DB latency
  - `ChaosControls`: Toggle buttons for CPU/Memory stress simulation

## Key Technical Decisions

### SSE over WebSocket

Server-Sent Events were chosen over WebSocket because:

- Data flows one direction only (server → client)
- SSE uses standard HTTP, simplifying proxy/load balancer configuration
- Built-in reconnection in the browser API
- Simpler server implementation (RxJS Observable → SSE)

See: `ADR-006-recharts-for-telemetry-visualization.md` (pending)

### Simulated Chaos Mode

Chaos mode is **simulated**, not real:

- Server always remains healthy
- Chaos flags passed as query parameters (`?chaos=cpu`)
- `MetricsService.applyChaosSim()` transforms real metrics to simulate degradation
- Each user session is independent (User A with chaos ON doesn't affect User B)

Benefits:

- Production-safe: Zero server impact
- Demonstrable extremes: Can simulate 500ms lag safely
- Multi-user compatible: Per-session isolation

See: [ADR-007: Simulated Chaos Mode](../decisions/ADR-007-simulated-chaos-mode.md)

### Recharts for Visualization

Recharts was selected for charting because:

- React-first component API (not imperative D3)
- TypeScript support included
- Responsive containers built-in
- Smaller bundle than Chart.js (~300KB vs ~700KB)
- Active maintenance and large community

See: [ADR-006: Recharts for Telemetry Visualization](../decisions/ADR-006-recharts-for-telemetry-visualization.md)

## File Structure

```
src/server/modules/health/
├── health.module.ts           # Module definition
├── health.controller.ts       # Existing health checks
├── sse.controller.ts          # SSE streaming endpoint
├── metrics.service.ts         # Metrics collection + chaos simulation
└── *.test.ts                  # Unit and integration tests

src/ui/containers/status/
├── status.container.tsx       # Main container component
├── status.container.test.tsx  # Integration tests
├── status.module.scss         # Container styles
├── components/
│   ├── TelemetryCharts.tsx    # Line charts
│   ├── VisualHeartbeat.tsx    # Animated pulse indicator
│   ├── LatencyChain.tsx       # Latency visualization
│   └── ChaosControls.tsx      # Chaos toggle buttons
└── hooks/
    └── useServerEventSource.ts # SSE connection hook

src/shared/types/
└── telemetry.types.ts         # TelemetrySnapshot interface
```

## API Reference

### SSE Endpoint

```
GET /api/health/stream
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `chaos` | string | Comma-separated flags: `cpu`, `memory` |

**SSE Event Format:**

```json
{
  "type": "telemetry",
  "data": {
    "timestamp": 1737200000000,
    "eventLoop": {
      "lagMs": 1.23,
      "min": 0.5,
      "max": 3.0,
      "mean": 1.2,
      "stddev": 0.4,
      "percentile99": 2.5
    },
    "memory": {
      "heapUsedMB": 52.3,
      "heapTotalMB": 100.0,
      "rssMB": 125.6,
      "externalMB": 8.2
    },
    "database": {
      "latencyMs": 0.8,
      "connected": true
    },
    "process": {
      "uptimeSeconds": 3600,
      "pid": 12345,
      "nodeVersion": "v20.0.0"
    },
    "chaos": {
      "cpuPressure": false,
      "memoryPressure": false
    }
  }
}
```

## Key Dependencies

- **Backend:** `perf_hooks` (Node.js built-in), TypeORM
- **Frontend:** `recharts`, `@tanstack/react-query`, React 19
- **Shared:** Custom `TelemetrySnapshot` type

## Testing Strategy

- **Backend Unit Tests:** `metrics.service.test.ts`
  - Verifies metric collection returns valid snapshots
  - Verifies chaos simulation transforms metrics correctly
- **Backend Integration Tests:** `health.integration.test.ts`
  - SSE endpoint returns proper event stream format
- **Frontend Integration Tests:** `status.container.test.tsx`
  - Mock `EventSource` to simulate SSE messages
  - Verify charts render with streamed data
  - Verify chaos controls toggle correctly

## Related Documentation

- [ADR-006: Recharts for Telemetry Visualization](../decisions/ADR-006-recharts-for-telemetry-visualization.md)
- [ADR-007: Simulated Chaos Mode](../decisions/ADR-007-simulated-chaos-mode.md)
- [Component: Traces (Request Observability)](traces.md) - Sub-feature for request-level tracing
