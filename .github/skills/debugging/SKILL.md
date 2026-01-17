---
name: debugging
description: Guide for step-through debugging with VS Code, React DevTools, and TanStack Query DevTools.
---

# Debugging

Use this skill when code runs but behaves unexpectedly, or you need to inspect runtime state.

**Related Skills:**

- For error messages (TypeScript, Jest, ESLint) → See `error-handling` skill
- For build/test failures at CI level → See `build-debug` prompt

## 1. VS Code Debugger

### Launch Configurations

This project has pre-configured debug targets. Access via:

- Press `F5` to start debugging
- Or: Run and Debug sidebar (`Ctrl+Shift+D`) → Select configuration

| Configuration    | Purpose                         |
| ---------------- | ------------------------------- |
| Debug Server     | Attach to NestJS backend        |
| Debug Chrome     | Debug React frontend in browser |
| Debug Jest Tests | Step through test execution     |

### Setting Breakpoints

1. **Click the line number gutter** (left of line numbers) - red dot appears
2. **Conditional breakpoints**: Right-click gutter → "Add Conditional Breakpoint"
3. **Logpoints**: Right-click gutter → "Add Logpoint" (logs without stopping)

### Debugging Workflow

```
1. Set breakpoints on suspicious lines
2. Press F5 (or select debug config)
3. Trigger the code path (API call, button click, etc.)
4. When breakpoint hits:
   - Inspect Variables panel (left sidebar)
   - Check Call Stack (see how you got here)
   - Add Watch expressions for computed values
   - Step Over (F10), Step Into (F11), Step Out (Shift+F11)
5. Press F5 to continue to next breakpoint
```

### Debug Server (NestJS)

```bash
# Start server in debug mode (if not using launch config)
npm run start:server:dev -- --debug
```

**Useful breakpoint locations:**

- Controller methods (incoming request)
- Service methods (business logic)
- Guards (authentication checks)
- Exception filters (error handling)

### Debug Frontend (Chrome)

1. Start the dev server: `npm run start:ui`
2. Press F5 with "Debug Chrome" selected
3. Chrome opens with debugger attached
4. Set breakpoints in VS Code - they work in browser code!

**Tip:** Chrome DevTools breakpoints also work alongside VS Code's.

## 2. Debugging Tests

### Jest Debug (Recommended)

**Using VS Code Debug Config:**

1. Open the test file
2. Set breakpoints
3. Select "Debug Jest Tests" config
4. Press F5

**Using Jest Runner Extension:**

1. Install "Jest Runner" extension
2. Look for "Debug" codelens above `it()` or `describe()`
3. Click "Debug" to run that specific test with debugger

**Command Line:**

```bash
# Debug a specific test file
node --inspect-brk node_modules/.bin/jest src/ui/containers/blog/blog.container.test.tsx --runInBand

# Then attach VS Code debugger
```

### Debugging Test Issues

| Symptom                        | Debug Strategy                             |
| ------------------------------ | ------------------------------------------ |
| Test passes alone, fails in CI | Run with `--runInBand` to prevent parallel |
| Async timeout                  | Add breakpoint, check if awaits resolve    |
| Wrong mock return              | Breakpoint in mock, verify call args       |
| State leaking between tests    | Check `beforeEach`/`afterEach` cleanup     |

## 3. React DevTools

### Installation

- **Chrome:** [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/)
- **Firefox:** React Developer Tools add-on
- **Edge:** React Developer Tools extension

### Components Tab

**Navigate the component tree:**

- Click components to inspect props and state
- Use search to find components by name
- Right-click → "Log this component" to console.log

**Key things to check:**

- Are props what you expect?
- Is state updating correctly?
- Is the component re-rendering unexpectedly?

### Profiler Tab

**Find performance issues:**

1. Click record button
2. Interact with the app
3. Stop recording
4. Analyze flame graph

**Look for:**

- Components that re-render often (highlighted in yellow/red)
- Long render times
- Unnecessary re-renders

### Highlight Updates

1. Open React DevTools settings (gear icon)
2. Enable "Highlight updates when components render"
3. Blue = fast render, Yellow/Red = slow render

**Use this to spot:**

- Unnecessary re-renders
- Components re-rendering on unrelated state changes

## 4. TanStack Query DevTools

### Setup

Already configured in this project! Look for the floating React Query logo in the bottom-left corner during development.

### Key Features

| Panel           | Purpose                                    |
| --------------- | ------------------------------------------ |
| Queries         | View all queries and their cache status    |
| Mutations       | Track in-flight and completed mutations    |
| Query Inspector | Inspect data, state, observers for a query |

### Query States

| State    | Meaning                                      |
| -------- | -------------------------------------------- |
| Fresh    | Data is current, won't refetch automatically |
| Stale    | Data may be outdated, will refetch on focus  |
| Fetching | Currently fetching data                      |
| Paused   | Query paused (e.g., `enabled: false`)        |
| Inactive | No components observing this query           |

### Debugging Patterns

**Query stuck loading?**

1. Check if `enabled` is `false` (paused)
2. Check network tab for failed request
3. Verify query function is correct

**Stale data showing?**

1. Check `staleTime` setting
2. Verify invalidation after mutation
3. Try manual refetch via DevTools

**Too many requests?**

1. Check query keys (are they stable?)
2. Look for duplicate queries with same data
3. Check `refetchInterval` settings

### Manual Actions

Right-click a query in DevTools to:

- **Refetch:** Force new request
- **Invalidate:** Mark as stale
- **Remove:** Clear from cache
- **Reset:** Reset to initial state

## 5. Network Debugging

### Browser DevTools Network Tab

1. Open DevTools (`F12`)
2. Go to Network tab
3. Filter by `XHR` or `Fetch`
4. Click request to inspect details

**Check for:**

- Status codes (200, 401, 404, 500)
- Request headers (Authorization present?)
- Request body (correct payload?)
- Response body (expected data shape?)

### Common Issues

| Status | Meaning              | Check                  |
| ------ | -------------------- | ---------------------- |
| 401    | Unauthorized         | Token missing/expired? |
| 403    | Forbidden            | User lacks permission? |
| 404    | Not Found            | Correct endpoint URL?  |
| 422    | Validation Error     | DTO validation failed? |
| 500    | Server Error         | Check server logs      |
| CORS   | Cross-Origin blocked | Backend CORS config    |

### Request Timing

Network tab shows request timing breakdown:

- **DNS Lookup:** Slow? Check DNS configuration
- **Waiting (TTFB):** Slow? Backend processing issue
- **Content Download:** Slow? Large response, check pagination

## 6. Console Debugging

### Strategic Logging

```typescript
// Add context to logs
console.log('[ComponentName] render', { props, state });
console.log('[useQuery] status', { status, data, error });
console.log('[mutation] submit', { input, result });
```

### Debug Helper Pattern

```typescript
// Temporary debug wrapper (remove before commit)
const debug = (label: string, data: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG ${label}]`, data);
  }
};

debug('BlogPost', { slug, query: query.status });
```

### Console Methods

| Method          | Use Case                       |
| --------------- | ------------------------------ |
| `console.log`   | General debugging              |
| `console.table` | Arrays/objects in table format |
| `console.dir`   | Full object inspection         |
| `console.group` | Group related logs             |
| `console.time`  | Measure execution time         |
| `console.trace` | Print call stack               |

**⚠️ Remember:** ESLint will warn about console statements. Remove before committing.

## 7. Debugging Checklist

When something doesn't work:

### Frontend Issues

- [ ] Check browser console for errors
- [ ] Verify component renders (React DevTools)
- [ ] Check props/state values (React DevTools)
- [ ] Inspect network requests (Network tab)
- [ ] Check query status (TanStack Query DevTools)
- [ ] Add breakpoint and step through

### Backend Issues

- [ ] Check server logs (terminal running NestJS)
- [ ] Verify request reaches controller (breakpoint/log)
- [ ] Check service method receives correct data
- [ ] Verify database query (log TypeORM queries)
- [ ] Check error response format

### State Issues

- [ ] Is data in TanStack Query cache?
- [ ] Is Zustand store updated?
- [ ] Are components subscribed to correct state?
- [ ] Is component re-rendering on state change?

## 8. Enabling Verbose Logging

### TypeORM SQL Logging

```typescript
// src/server/app.module.ts (temporary)
TypeOrmModule.forRoot({
  // ...
  logging: true, // Logs all SQL queries
  logger: 'advanced-console',
});
```

### Axios Request Logging

```typescript
// Temporary interceptor for debugging
axios.interceptors.request.use((config) => {
  console.log('[axios]', config.method?.toUpperCase(), config.url);
  return config;
});

axios.interceptors.response.use(
  (response) => {
    console.log('[axios] response', response.status, response.data);
    return response;
  },
  (error) => {
    console.log('[axios] error', error.response?.status, error.message);
    return Promise.reject(error);
  },
);
```

### TanStack Query Logging

```typescript
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Log all query events
      onSuccess: (data) => console.log('[query] success', data),
      onError: (error) => console.log('[query] error', error),
    },
  },
});
```
