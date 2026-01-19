# ADR-007: Simulated Chaos Mode for Telemetry Dashboard

## Status

Accepted - January 18, 2026

## Context

The [Mission Control Telemetry Dashboard](../projects/mission-control-implementation.md)
needs to demonstrate how the system behaves under stress conditions. This is
valuable for:

1. **Portfolio demonstration**: Showing observers that metrics respond to load
2. **Dashboard testing**: Verifying UI handles degraded states correctly
3. **Visual feedback validation**: Confirming health indicators work as designed

### Original Approach (Rejected)

The initial design proposed **real chaos injection**:

```typescript
// ❌ REJECTED: Actual CPU stress
@Post('/chaos')
@UseGuards(DevOnlyGuard)
async injectChaos(@Body() { type }: { type: 'cpu' | 'memory' }) {
  if (type === 'cpu') {
    // Actually spin CPU - dangerous in production!
    while (Date.now() < start + 5000) { /* burn cycles */ }
  }
}
```

**Problems with this approach:**

1. **Production risk**: Even with guards, accidental deployment could harm the
   production server.
2. **Shared resource impact**: In containerized environments, CPU stress affects
   neighboring services.
3. **Demo limitations**: Can't safely demonstrate in production portfolio.
4. **Recovery complexity**: Real stress requires cooldown periods.

## Decision

We will use **simulated chaos** that transforms metric values without affecting
actual server performance.

### How It Works

1. **Client-side control**: Chaos flags are passed as query parameters:

   ```
   GET /api/health/stream?chaos=cpu,memory
   ```

2. **Server-side transformation**: The `MetricsService.applyChaosSim()` method
   modifies the reported metrics, not the actual system:

   ```typescript
   applyChaosSim(snapshot: TelemetrySnapshot, flags: ChaosFlags): TelemetrySnapshot {
     const result = structuredClone(snapshot);

     if (flags.cpu) {
       // Simulate high event loop lag (50-150ms instead of real ~1ms)
       result.eventLoop.lagMs = 50 + Math.random() * 100;
     }

     if (flags.memory) {
       // Simulate memory pressure (1.5-2x reported usage)
       const multiplier = 1.5 + Math.random() * 0.5;
       result.memory.heapUsedMB *= multiplier;
       result.memory.rssMB *= multiplier;
     }

     return result;
   }
   ```

3. **Per-session isolation**: Each SSE connection has its own chaos state. One
   user enabling chaos doesn't affect other users' dashboards.

4. **Zero server impact**: The actual Node.js process remains healthy. Only the
   numbers displayed in the dashboard change.

### UI Indication

The dashboard clearly communicates simulation mode:

```tsx
<p className={styles.info}>
  🔬 <strong>Simulation Mode:</strong> These controls simulate system stress for
  demonstration. The actual server remains healthy—only the reported metrics are
  modified.
</p>
```

## Consequences

### Positive

- **Production-safe**: No risk of actual server degradation
- **Instant activation**: No warm-up or cooldown required
- **Deterministic ranges**: Simulated values stay within reasonable bounds
- **Session isolation**: Multiple viewers see their own chaos state
- **Demo-friendly**: Can be shown to anyone visiting the portfolio

### Negative

- **Not real chaos testing**: This doesn't validate actual system resilience.
  For real chaos engineering, use tools like Chaos Monkey in a staging
  environment.

- **Synthetic patterns**: Simulated metrics don't reflect real failure modes
  (e.g., garbage collection pauses, memory fragmentation patterns).

### Mitigation for Real Chaos Testing

If actual chaos engineering is needed in the future, implement it as:

1. **Separate tool**: Use established chaos engineering tools (Chaos Monkey,
   Gremlin, LitmusChaos)
2. **Staging only**: Never in production
3. **Automated recovery**: Circuit breakers and health checks
4. **Observability**: Full tracing and alerting

## Implementation Notes

### Chaos Query Parameter Format

```
?chaos=cpu           # CPU stress only
?chaos=memory        # Memory stress only
?chaos=cpu,memory    # Both stressors
```

### Frontend Toggle State

The `ChaosControls` component manages local state and updates the SSE URL:

```tsx
const [chaosFlags, setChaosFlags] = useState<ChaosFlags>({
  cpu: false,
  memory: false,
});

// When flags change, hook reconnects with new URL
const { data } = useServerEventSource({
  baseUrl: '/api/health/stream',
  chaosFlags,
});
```

### Testing

Chaos simulation is fully unit tested. See
[metrics.service.test.ts](../../src/server/modules/health/metrics.service.test.ts)
for coverage of `applyChaosSim()`.

## Related Decisions

- [ADR-006: Recharts for Telemetry Visualization](./ADR-006-recharts-for-telemetry-visualization.md) -
  Chart rendering for telemetry data
