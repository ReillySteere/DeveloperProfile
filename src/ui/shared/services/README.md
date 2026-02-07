# Shared Services

This folder contains **non-React services** that provide application-wide functionality outside the React component tree.

## Purpose

Services are separated from hooks and components because they:

1. **Operate independently of React lifecycle** - They run as singletons and persist state across component mounts/unmounts
2. **Provide imperative APIs** - Unlike hooks which follow React's declarative model
3. **May initialize on module load** - Such as registering browser API observers immediately

## Contents

| File                     | Purpose                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| `performanceObserver.ts` | Singleton that collects Web Vitals metrics and reports them to the API |
| `performanceScoring.ts`  | Pure utility functions for calculating performance scores from metrics |

## Usage Pattern

Services are consumed by React hooks which bridge them to the component tree:

```
┌────────────────────────────────────────────────────────┐
│  Component (PerformanceBadge)                          │
│    └── uses hook (useWebVitals)                        │
│          └── subscribes to service (performanceObserver)│
└────────────────────────────────────────────────────────┘
```

### Example

```typescript
// Service - runs outside React
export const performanceObserver = new PerformanceObserverService();

// Hook - bridges service to React
export function useWebVitals() {
  const [vitals, setVitals] = useState(performanceObserver.getCurrentMetrics());

  useEffect(() => {
    return performanceObserver.subscribe((metric) => {
      setVitals(performanceObserver.getCurrentMetrics());
    });
  }, []);

  return vitals;
}

// Component - uses hook
function PerformanceBadge() {
  const vitals = useWebVitals();
  // render...
}
```

## Guidelines

- **Singletons** should be instantiated and exported at module level
- **Pure functions** (like `performanceScoring.ts`) should have no side effects
- **Services requiring cleanup** should expose unsubscribe/dispose methods
- **Testing**: Mock services at the module level in tests; pure functions can be tested directly
