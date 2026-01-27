/**
 * MSW Server Setup for Node.js Tests
 *
 * This file sets up the MSW server for Jest tests running in Node.js.
 * Import this in your test setup file to enable API mocking.
 *
 * @see https://mswjs.io/docs/integrations/node
 */
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW server instance for Node.js tests.
 * Start this in beforeAll and close in afterAll.
 */
export const server = setupServer(...handlers);

/**
 * Reset handlers to defaults between tests.
 * Call this in afterEach to ensure clean state.
 */
export function resetHandlers() {
  server.resetHandlers();
}

/**
 * Add runtime handlers for specific test scenarios.
 * These override the default handlers for the current test.
 *
 * @example
 * ```typescript
 * import { server, addHandlers, createTraceHandlers } from 'ui/test-utils/msw';
 *
 * it('handles empty traces', () => {
 *   addHandlers(...createTraceHandlers({ traces: [] }));
 *   // Test with empty traces
 * });
 * ```
 */
export function addHandlers(
  ...newHandlers: Parameters<typeof server.use>
): void {
  server.use(...newHandlers);
}

// Re-export everything from handlers for convenience
export * from './handlers';
