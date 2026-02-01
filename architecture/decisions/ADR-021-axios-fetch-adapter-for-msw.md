# ADR-021: Axios Fetch Adapter for MSW Compatibility

**Status:** Accepted  
**Date:** 2026-02-01  
**Deciders:** Engineering Team  
**Tags:** testing, msw, axios, integration-tests

## Context

When implementing MSW (Mock Service Worker) for API mocking in integration tests, we encountered a critical incompatibility between MSW's XHR interceptor and DOM emulation libraries (jsdom, happy-dom).

### The Problem

MSW 2.x uses `@mswjs/interceptors` to intercept HTTP requests. When intercepting XMLHttpRequest (XHR) requests made by axios, MSW attempts to stream the response body:

```typescript
// From @mswjs/interceptors/src/interceptors/XMLHttpRequest/XMLHttpRequestController.ts:440
const reader = response.body.getReader();
```

However, jsdom's XHR implementation doesn't expose `response.body` as a proper `ReadableStream` with a `getReader()` method, causing:

```
TypeError: response.body.getReader is not a function
```

This causes all axios-based tests to hang in loading state, as the mocked request never completes.

### Test Failure Example

```typescript
// Component using axios + TanStack Query
const MyComponent = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await axios.get('/api/posts');
      return response.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>{data.title}</div>;
};

// Test with MSW
it('should fetch and display posts', async () => {
  server.use(
    http.get('/api/posts', () => {
      return HttpResponse.json({ title: 'Test Post' });
    }),
  );

  render(<MyComponent />);

  // WITHOUT fetch adapter: Test hangs forever
  // Error: response.body.getReader is not a function

  // WITH fetch adapter: Test passes
  await waitFor(() => {
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });
});
```

### Why This Happens

1. axios defaults to XMLHttpRequest in browser environments
2. MSW intercepts the XHR request
3. MSW creates a Response object with a body stream
4. MSW tries to call `response.body.getReader()` to stream the response
5. jsdom's XHR doesn't implement the Streams API properly
6. Error thrown, request never completes

### Alternatives Considered

1. **Switch to happy-dom**: Tested, same error. Not a jsdom-specific issue.
2. **Patch jsdom's Response object**: Complex, fragile, would break on updates.
3. **Mock axios instead of using MSW**: Loses network-level testing benefits, dual patterns.
4. **Rewrite all hooks to use fetch()**: Major refactor, breaks production code.
5. **Use axios fetch adapter in tests only**: ✅ Chosen solution.

## Decision

We will configure axios to use a custom fetch-based adapter in all UI tests. This adapter:

1. Converts axios requests to `fetch()` calls under the hood
2. Maintains axios's API and response format
3. Enables MSW's fetch interceptor (which works correctly)
4. Requires no changes to production code or individual tests

Implementation in `src/ui/test-utils/axios-fetch-adapter.ts`:

```typescript
const fetchAdapter: AxiosAdapter = async (
  config: InternalAxiosRequestConfig,
) => {
  // Convert axios config to fetch options
  const response = await fetch(url, {
    method: config.method.toUpperCase(),
    headers: convertHeaders(config.headers),
    body: config.data,
    signal: config.signal,
  });

  // Convert fetch response to axios format
  return {
    data: await parseResponse(response),
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    config,
  };
};

axios.defaults.adapter = fetchAdapter;
```

The adapter is configured globally in `jest-preloaded.ts` before any tests run.

## Consequences

### Positive

- **"It just works"**: No changes needed to individual tests
- **Network-level mocking**: MSW intercepts at the network layer (more realistic than mocking axios)
- **Single pattern**: All tests use MSW, no dual testing strategies
- **Production unchanged**: axios still uses XHR in production builds
- **Future-proof**: Works with all MSW features (streaming, delays, etc.)
- **Type-safe**: Full TypeScript support maintained

### Negative

- **Hidden abstraction**: Developers may not realize axios uses fetch in tests
- **Slight behavior difference**: fetch() and XHR have minor API differences
- **Custom code**: Maintains a custom adapter (though small and stable)

### Neutral

- **Test environment only**: Adapter only active in Jest environment
- **Performance**: fetch() in jsdom has similar performance to XHR

## Compliance

This decision aligns with:

- **ADR-015** (Testing Strategy): Supports Testing Trophy integration-first approach
- **ADR-016** (Test Utilities Architecture): Centralized configuration in test-utils
- **"It should just work" principle**: Transparent to developers writing tests

## References

- MSW GitHub: https://github.com/mswjs/msw
- @mswjs/interceptors: https://github.com/mswjs/interceptors
- Related Issue: https://github.com/mswjs/msw/issues/1916
- axios Adapters: https://axios-http.com/docs/req_config

## Revision History

- 2026-02-01: Initial decision (v1.0)
