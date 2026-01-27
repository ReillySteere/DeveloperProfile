/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Jest Setup File for UI Tests
 *
 * This file runs after the test environment is ready and sets up:
 * - Testing Library DOM matchers
 * - MSW server for API mocking
 * - Fetch mocks
 *
 * Note: Polyfills (TextEncoder, etc.) are set up in jest-polyfills.ts
 * which runs before this file via Jest's setupFiles config.
 */
import '@testing-library/jest-dom';
import { enableFetchMocks } from 'jest-fetch-mock';
import { cleanup } from './test-utils';
import { server } from './msw/server';

/* eslint camelcase: "off" */
(global as any).__non_webpack_require__ = (path: string) => require(path);
(global as any).__webpack_public_path__ = '';

enableFetchMocks();

// MSW Server Setup
// Start server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'bypass', // Don't warn for unhandled requests
  });
});

// Reset handlers after each test to ensure clean state
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});
