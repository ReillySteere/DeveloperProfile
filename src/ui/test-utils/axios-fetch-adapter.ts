/**
 * Axios Fetch Adapter for Tests
 *
 * ## Problem
 *
 * MSW (Mock Service Worker) 2.x uses the `@mswjs/interceptors` package to intercept
 * HTTP requests. This package provides separate interceptors for:
 * - `fetch()` API (works correctly)
 * - `XMLHttpRequest` (XHR) API (fails in test environments)
 *
 * The XHR interceptor has a critical incompatibility with DOM emulation libraries
 * (jsdom, happy-dom). When MSW intercepts an XHR request and creates a mock Response,
 * it attempts to stream the response body using:
 *
 * ```typescript
 * const reader = response.body.getReader(); // Line 440 in XMLHttpRequestController.ts
 * ```
 *
 * However, jsdom's XMLHttpRequest implementation doesn't expose `response.body` as a
 * proper ReadableStream with a `getReader()` method, causing the error:
 *
 * ```
 * TypeError: response.body.getReader is not a function
 *   at XMLHttpRequestController.respondWith
 *   (node_modules/@mswjs/interceptors/src/interceptors/XMLHttpRequest/XMLHttpRequestController.ts:440:36)
 * ```
 *
 * ## Why This Happens
 *
 * 1. axios (by default) uses XMLHttpRequest in browser/browser-like environments
 * 2. MSW intercepts the XHR request
 * 3. MSW creates a Response object from the handler's HttpResponse.json()
 * 4. MSW tries to stream response.body using getReader()
 * 5. jsdom's XHR doesn't implement the Streams API properly
 * 6. Request fails, tests hang in loading state
 *
 * ## Why Not Just Switch DOM Libraries?
 *
 * This issue is NOT specific to jsdom. Testing with happy-dom produced identical results.
 * The problem is in MSW's XHR interceptor expectations vs. what DOM emulators provide.
 *
 * ## Solution
 *
 * Configure axios to use the fetch API instead of XMLHttpRequest. MSW's fetch interceptor
 * works perfectly because:
 * - fetch() has proper ReadableStream support in jsdom
 * - MSW's fetch interceptor is more mature and widely used
 * - All modern browsers support fetch natively
 *
 * This adapter converts axios requests to fetch() calls transparently, maintaining
 * axios's API while enabling MSW interception.
 *
 * ## Example: Test That Would Fail Without This Adapter
 *
 * ```typescript
 * // Component using axios + TanStack Query
 * const MyComponent = () => {
 *   const { data, isLoading } = useQuery({
 *     queryKey: ['posts'],
 *     queryFn: async () => {
 *       const response = await axios.get('/api/posts');
 *       return response.data;
 *     },
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   return <div>{data.title}</div>;
 * };
 *
 * // Test with MSW
 * describe('MyComponent', () => {
 *   it('should fetch and display posts', async () => {
 *     // MSW handler
 *     server.use(
 *       http.get('/api/posts', () => {
 *         return HttpResponse.json({ title: 'Test Post' });
 *       }),
 *     );
 *
 *     render(<MyComponent />);
 *
 *     // WITHOUT fetch adapter: Test hangs in "Loading..." state
 *     //   Error: response.body.getReader is not a function
 *     //   axios request never completes
 *
 *     // WITH fetch adapter: Test passes
 *     await waitFor(() => {
 *       expect(screen.getByText('Test Post')).toBeInTheDocument();
 *     });
 *   });
 * });
 * ```
 *
 * ## Impact
 *
 * - All axios requests in tests now use fetch() under the hood
 * - MSW intercepts work transparently
 * - No changes needed to production code
 * - No changes needed to individual tests
 * - Maintains "it just works" principle
 *
 * ## References
 *
 * - MSW GitHub: https://github.com/mswjs/msw
 * - @mswjs/interceptors: https://github.com/mswjs/interceptors
 * - Related Issue: https://github.com/mswjs/msw/issues/1916
 *
 * @module axios-fetch-adapter
 */
import axios, {
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios';

/**
 * Custom fetch-based adapter for axios.
 *
 * Converts axios requests to fetch() calls so MSW can intercept them properly.
 * Maintains axios's request/response format while using fetch under the hood.
 *
 * @param config - Axios request configuration
 * @returns Axios-formatted response object
 */
const fetchAdapter: AxiosAdapter = async (
  config: InternalAxiosRequestConfig,
) => {
  const {
    url,
    method = 'get',
    data,
    headers,
    params,
    timeout,
    signal,
  } = config;

  // Build URL with query params
  const fullUrl = new URL(
    url!,
    globalThis.location?.origin || 'http://localhost',
  );
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      fullUrl.searchParams.append(key, String(value));
    });
  }

  // Convert axios headers to fetch headers
  const fetchHeaders = new Headers();
  if (headers) {
    // headers can be an AxiosHeaders object or a plain object
    if (typeof headers === 'object') {
      Object.entries(headers).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          fetchHeaders.set(key, String(value));
        }
      });
    }
  }

  // Handle timeout
  const abortController = new AbortController();
  const timeoutId = timeout
    ? setTimeout(() => abortController.abort(), timeout)
    : undefined;

  // Combine signal from config with our abort controller
  let combinedSignal = abortController.signal;
  if (signal && typeof signal.addEventListener === 'function') {
    if (signal.aborted) abortController.abort();
    signal.addEventListener('abort', () => abortController.abort());
  }

  try {
    // Make fetch request
    const response = await fetch(fullUrl.toString(), {
      method: method.toUpperCase(),
      headers: fetchHeaders,
      body: data
        ? typeof data === 'string'
          ? data
          : JSON.stringify(data)
        : undefined,
      signal: combinedSignal,
    });

    // Convert fetch response to axios response format
    const responseData = await response.text().then((text) => {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    });

    // Check if response should be rejected based on status code
    // Default axios behavior: reject on status outside 200-299
    const validateStatus =
      config.validateStatus ??
      ((status: number) => status >= 200 && status < 300);
    if (!validateStatus(response.status)) {
      const error = new Error(
        `Request failed with status code ${response.status}`,
      ) as Error & {
        response: object;
        config: object;
        isAxiosError: boolean;
      };
      error.response = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        config,
      };
      error.config = config;
      error.isAxiosError = true;
      throw error;
    }

    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
      request: {},
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

/**
 * Configure axios to use fetch adapter for all requests.
 *
 * This must be called before any axios requests are made in tests.
 * Called automatically by jest-preloaded.ts during test setup.
 */
export function setupAxiosFetchAdapter() {
  axios.defaults.adapter = fetchAdapter;
}
