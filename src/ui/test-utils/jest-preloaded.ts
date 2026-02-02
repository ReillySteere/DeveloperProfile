/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Jest Setup File for UI Tests
 *
 * This file runs after the test environment is ready and sets up:
 * - Testing Library DOM matchers
 * - MSW server for API mocking
 * - Axios fetch adapter for MSW compatibility (critical!)
 * - Fetch mocks
 *
 * Note: Polyfills (TextEncoder, etc.) are set up in jest-polyfills.ts
 * which runs before this file via Jest's setupFiles config.
 *
 * ## Axios Fetch Adapter
 *
 * The setupAxiosFetchAdapter() call is CRITICAL for MSW to work with axios.
 * Without it, all axios-based tests will hang because MSW's XHR interceptor
 * doesn't work properly in jsdom. See axios-fetch-adapter.ts for full details.
 */
import '@testing-library/jest-dom';
import { enableFetchMocks } from 'jest-fetch-mock';
import { cleanup } from './test-utils';
import { server } from './msw/server';
import { setupAxiosFetchAdapter } from './axios-fetch-adapter';

/* eslint camelcase: "off" */
(global as any).__non_webpack_require__ = (path: string) => require(path);
(global as any).__webpack_public_path__ = '';

enableFetchMocks();

// Configure axios to use fetch adapter for MSW compatibility
// This MUST be called before any tests run
setupAxiosFetchAdapter();

// Global mocks for ESM-only markdown packages
// These packages don't work well with Jest's module system, so we mock them globally
jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: (props: any) => {
    return require('react').createElement('div', null, props.children);
  },
}));

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
