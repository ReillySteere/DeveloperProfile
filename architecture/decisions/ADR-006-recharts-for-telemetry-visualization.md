# ADR-006: Recharts for Telemetry Visualization

## Status

Accepted - January 18, 2026

## Context

The [Mission Control Telemetry Dashboard](../projects/mission-control-implementation.md)
requires real-time charting to visualize system metrics (event loop lag, memory
usage, database latency). The frontend needs a charting library that:

1. **React-first**: Native React components, not a wrapper around D3 or similar
2. **TypeScript support**: Full type definitions
3. **Lightweight**: Minimal bundle size impact
4. **Real-time capable**: Smooth updates for streaming data
5. **Responsive**: Works across device sizes
6. **Accessible**: Keyboard navigation and screen reader support

### Alternatives Considered

| Library       | Size (min+gzip) | React Native | TypeScript | Streaming Support |
| ------------- | --------------- | ------------ | ---------- | ----------------- |
| Recharts      | ~45KB           | Yes          | Yes        | Good              |
| Chart.js      | ~60KB           | Wrapper      | Yes        | Good              |
| Victory       | ~50KB           | Yes          | Yes        | Good              |
| Nivo          | ~80KB           | Yes          | Yes        | Good              |
| Visx (Airbnb) | ~30KB (base)    | Yes          | Yes        | Manual            |

## Decision

We will use **Recharts** (v2.13+) for telemetry visualization.

### Justification

1. **React-first design**: Recharts is built as React components, not a wrapper.
   This means we can compose charts declaratively with JSX.

2. **Excellent DX**: The API is intuitive and matches React patterns:

   ```tsx
   <LineChart data={chartData}>
     <Line dataKey="eventLoopLag" stroke="#8884d8" />
     <XAxis dataKey="time" />
     <YAxis />
     <Tooltip />
   </LineChart>
   ```

3. **TypeScript included**: Full type definitions ship with the package.

4. **ResponsiveContainer**: Built-in responsive wrapper handles resizing
   without custom ResizeObserver logic.

5. **Active maintenance**: Regular releases, good community support.

6. **Already proven**: Used by major companies (Netflix, Shopify, Twilio).

### Trade-offs

- **Larger than Visx**: Recharts is ~45KB vs Visx's modular ~30KB base. However,
  Visx requires significant boilerplate for common chart patterns.

- **Not D3-level flexibility**: Complex custom visualizations may require
  escaping to lower-level D3. For our telemetry use case, standard line/area
  charts are sufficient.

## Consequences

### Positive

- **Fast implementation**: Charts can be built quickly with declarative JSX.
- **Consistent styling**: CSS-in-JS and prop-based styling integrate well with
  our SCSS modules approach.
- **Smooth streaming updates**: React's reconciliation handles data updates
  efficiently for the 1-second SSE interval.

### Negative

- **Bundle size**: Adds ~45KB to the frontend bundle. This is acceptable given
  the feature value and lazy-loading via TanStack Router's code splitting.

- **Limited customization**: Very custom chart types may require a different
  library or D3 directly.

## Implementation Notes

### Installation

```bash
npm install recharts
```

### Usage Pattern

See [status.container.tsx](../../src/ui/containers/status/status.container.tsx)
and [TelemetryCharts.tsx](../../src/ui/containers/status/components/TelemetryCharts.tsx)
for the implementation.

### Testing Strategy

Recharts components are mocked in Jest tests to avoid ResizeObserver issues:

```tsx
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  // ... other components
}));
```

## Related Decisions

- [ADR-003: Centralized Axios Interceptors](./ADR-003-centralized-axios-interceptors.md) -
  API communication patterns
- [ADR-007: Simulated Chaos Mode](./ADR-007-simulated-chaos-mode.md) -
  Chaos engineering approach for telemetry demo
