/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Jest Setup File for UI Tests
 *
 * This file runs after the test environment is ready and sets up:
 * - Testing Library DOM matchers
 * - MSW server for API mocking
 * - Axios fetch adapter for MSW compatibility (critical!)
 * - Fetch mocks
 * - Console warning suppression for known benign warnings
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

// Suppress known benign warnings in tests
// TanStack Router warns when useNavigate/useRouter is used outside RouterProvider,
// but our tests intentionally mock the Link component and don't need the full router.
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    message.includes('useRouter must be used inside a <RouterProvider>')
  ) {
    return; // Suppress this specific warning
  }
  originalWarn.apply(console, args);
};

// Configure axios to use fetch adapter for MSW compatibility
// This MUST be called before any tests run
setupAxiosFetchAdapter();

// Global mocks for ESM-only markdown packages
// These packages don't work well with Jest's module system, so we mock them globally.
// See mockMarkdown.tsx for the mock implementations.
jest.mock(
  'react-markdown',
  () => require('test-utils/mockMarkdown').mockReactMarkdownModule,
);
jest.mock(
  'remark-gfm',
  () => require('test-utils/mockMarkdown').mockRemarkGfmModule,
);
jest.mock(
  'mermaid',
  () => require('test-utils/mockMarkdown').mockMermaidModule,
);

// Mock react-syntax-highlighter (has ESM dependencies like refractor)
jest.mock(
  'react-syntax-highlighter',
  () => require('test-utils/mockMarkdown').mockSyntaxHighlighterModule,
);
jest.mock(
  'react-syntax-highlighter/dist/cjs/prism-light',
  () => require('test-utils/mockMarkdown').mockSyntaxHighlighterModule,
);
jest.mock(
  'react-syntax-highlighter/dist/cjs/styles/prism',
  () => require('test-utils/mockMarkdown').mockSyntaxHighlighterStylesModule,
);
jest.mock(
  'react-syntax-highlighter/dist/cjs/languages/prism/typescript',
  () => require('test-utils/mockMarkdown').mockLanguageModule,
);
jest.mock(
  'react-syntax-highlighter/dist/cjs/languages/prism/bash',
  () => require('test-utils/mockMarkdown').mockLanguageModule,
);
jest.mock(
  'react-syntax-highlighter/dist/cjs/languages/prism/json',
  () => require('test-utils/mockMarkdown').mockLanguageModule,
);
jest.mock(
  'react-syntax-highlighter/dist/cjs/languages/prism/markdown',
  () => require('test-utils/mockMarkdown').mockLanguageModule,
);

// Global mock for web-vitals (requires browser Performance API not in jsdom)
// See mockWebVitals.ts for the mock implementation.
jest.mock(
  'web-vitals',
  () => require('test-utils/mockWebVitals').mockWebVitals,
);

// Global mock for axe-core (requires full browser DOM not available in jsdom)
jest.mock('axe-core', () => ({
  default: {
    run: jest.fn().mockResolvedValue({
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: [],
    }),
  },
  __esModule: true,
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
