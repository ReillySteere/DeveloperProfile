# ADR-016: Test Utilities Architecture

## Status

Accepted - February 1, 2026

## Context

The testing strategy (ADR-015) requires robust test utilities to support integration testing
at scale. This ADR documents the design decisions for test utilities that enable consistent,
maintainable tests.

### Utilities Required

1. **Network mocking**: Simulate API responses for frontend tests
2. **SSE testing**: Test Server-Sent Events streaming
3. **Chart mocking**: Test visualization components without rendering overhead
4. **Async state handling**: Standardize loading/error/empty state testing

## Decision

### 1. MSW Handler Factories

**Use factory functions** for MSW handlers to enable scenario-based testing.

```typescript
// src/ui/test-utils/msw/handlers.ts
type AuthScenario = 'success' | 'failure' | 'missing-token' | 'network-error';

export const createAuthHandlers = (options?: {
  scenario?: AuthScenario;
  delayMs?: number;
}) => [
  http.post('/api/auth/login', async () => {
    if (options?.delayMs) await delay(options.delayMs);

    switch (options?.scenario) {
      case 'failure':
        return HttpResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 },
        );
      case 'network-error':
        return HttpResponse.error();
      default:
        return HttpResponse.json({ access_token: 'mock-token' });
    }
  }),
];
```

**Rationale**:

- Factory/Builder pattern scales with domain complexity
- Scenarios are explicit and discoverable
- Delay support enables loading state testing
- Wide applicability as the domain grows

**Alternatives considered**: None formally evaluated. Factory pattern was selected for its
proven scalability and readability. Future enhancements could include:

- Builder pattern with method chaining
- Fixture files with scenario definitions
- Property-based testing integration

### 2. MockEventSource

**Custom implementation** for testing Server-Sent Events.

```typescript
// src/ui/test-utils/mockEventSource.ts
export class MockEventSource {
  static instances: MockEventSource[] = [];

  readyState: number = EventSource.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  simulateOpen(): void { ... }
  simulateMessage(data: unknown): void { ... }
  simulateError(): void { ... }

  static reset(): void {
    MockEventSource.instances = [];
  }
}
```

**Rationale**:

- Provides full control over SSE lifecycle
- Static instances list enables test assertions
- Quick implementation for immediate needs

**Status**: This was a pragmatic short-term solution. Should evaluate existing libraries:

- `eventsource-mock`
- MSW EventSource support (when available)
- `jest-websocket-mock` patterns

**Future consideration**: Replace with library if one provides equivalent functionality
with less maintenance burden.

### 3. mockRecharts

**Mock external charting library** to isolate domain logic from visualization rendering.

```typescript
// src/ui/test-utils/mockRecharts.tsx
export const mockRecharts = () => {
  jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    Line: ({ dataKey }) => <div data-testid={`line-${dataKey}`} />,
    XAxis: ({ tickFormatter }) => {
      // Execute formatter for coverage
      if (tickFormatter) tickFormatter(Date.now());
      return <div data-testid="x-axis" />;
    },
    // ... other components
  }));
};
```

**Rationale**:

- External libraries are assumed to work correctly
- Testing Recharts internals is outside our domain
- Mocks execute formatters to maintain coverage
- Reduces test complexity and runtime

**Key principle**: Only test functionality germane to our domain. Complex library integrations
should be mocked to simulate expected behavior, not verify library internals.

### 4. QueryState Component

**Render props pattern** for handling async states consistently.

```typescript
// src/ui/shared/components/QueryState/QueryState.tsx
interface QueryStateProps<T> {
  isLoading: boolean;
  isError: boolean;
  data?: T;
  error?: Error | null;
  refetch?: () => void;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  children: (data: T) => React.ReactNode;
  isEmpty?: (data: T) => boolean;
}

export function QueryState<T>({ children, ...props }: QueryStateProps<T>) {
  if (props.isLoading) return loadingComponent || <DefaultLoading />;
  if (props.isError) return errorComponent || <DefaultError />;
  if (props.data && props.isEmpty?.(props.data)) return emptyComponent || <DefaultEmpty />;
  if (props.data) return <>{children(props.data)}</>;
  return null;
}
```

**Rationale**:

- Render props ensure isolation from specific endpoints
- Component stays view-focused, not data-coupled
- Complexity doesn't warrant a provider pattern
- Applied at first level of containers, not deeply nested

**Why not a hook?**:

- Hooks would couple rendering logic to data fetching
- Render props make the data→view flow explicit
- Easier to test loading/error states in isolation

**Why not a provider?**:

- Single-level application (container → QueryState → children)
- No need for deep prop drilling that providers solve
- Simpler mental model

## Implementation

### Test Utils Directory Structure

```
src/ui/test-utils/
├── index.ts                    # Re-exports render, screen, etc.
├── test-utils.tsx              # Custom render with QueryClient
├── jest-polyfills.ts           # Pre-environment setup
├── jest-preloaded.ts           # Post-environment setup (MSW, global mocks)
├── axios-fetch-adapter.ts      # Axios→fetch for MSW compatibility (ADR-021)
├── mockEventSource.ts          # SSE testing utility
├── mockRecharts.tsx            # Chart mocking utility
├── mockMarkdown.tsx            # Markdown/syntax highlighter mocks
├── mockWebVitals.ts            # Web Vitals API mock
└── msw/
    ├── handlers.ts             # Handler factories
    ├── server.ts               # MSW server setup
    └── index.ts                # Barrel exports
```

### Global Mocks

ESM-only libraries and browser APIs are mocked globally in `jest-preloaded.ts`:

| Mock Module        | Library                                                               | Reason                           |
| ------------------ | --------------------------------------------------------------------- | -------------------------------- |
| `mockMarkdown.tsx` | `react-markdown`, `remark-gfm`, `mermaid`, `react-syntax-highlighter` | ESM-only, complex dependencies   |
| `mockWebVitals.ts` | `web-vitals`                                                          | Requires browser Performance API |
| `mockRecharts.tsx` | `recharts`                                                            | SVG rendering in jsdom           |

This enables all shared components to be exported via barrel file without test failures:

```typescript
// All components available through barrel - mocks handle ESM issues
import {
  MarkdownContent,
  Mermaid,
  PerformanceBadge,
} from 'ui/shared/components';
```

### Usage Patterns

```typescript
// Container test with MSW
import { render, screen, waitFor } from 'ui/test-utils';
import { server } from 'ui/test-utils/msw';
import { createBlogHandlers } from 'ui/test-utils/msw/handlers';

describe('BlogContainer', () => {
  it('handles error state', async () => {
    server.use(...createBlogHandlers({ scenario: 'error' }));

    render(<BlogContainer />);

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
```

## Consequences

### Positive

- **Consistent patterns**: All tests follow same utilities
- **Scenario coverage**: Factory pattern enables comprehensive scenario testing
- **Isolation**: Mocked externals don't affect test reliability
- **Maintainability**: Centralized utilities, single point of change

### Negative

- **Custom code**: MockEventSource requires maintenance
- **Learning curve**: Team must understand utility patterns
- **Mock drift**: Mocked libraries could diverge from real behavior

### Future Improvements

| Utility         | Potential Enhancement                                  |
| --------------- | ------------------------------------------------------ |
| MockEventSource | Evaluate `eventsource-mock` or MSW EventSource support |
| mockRecharts    | Consider visual regression testing for charts          |
| MSW handlers    | Add request body validation for mutation handlers      |
| QueryState      | Add retry UI testing patterns                          |

## Related Documentation

- [ADR-015: Testing Strategy](ADR-015-testing-strategy.md)
- [Testing Workflow Skill](../../.github/skills/testing-workflow/SKILL.md)
- [MSW Documentation](https://mswjs.io/)
