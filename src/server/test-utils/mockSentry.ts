/**
 * Mock for @sentry/node in tests.
 *
 * Usage:
 * ```typescript
 * import { mockSentry, createMockSentry } from 'server/test-utils/mockSentry';
 *
 * jest.mock('@sentry/node', () => mockSentry);
 *
 * // Or for more control:
 * const sentry = createMockSentry();
 * jest.mock('@sentry/node', () => sentry);
 * ```
 */

export interface MockSentryScope {
  setExtra: jest.Mock;
  setTag: jest.Mock;
  setUser: jest.Mock;
  setLevel: jest.Mock;
  setContext: jest.Mock;
}

export interface MockSentry {
  captureException: jest.Mock;
  captureMessage: jest.Mock;
  init: jest.Mock;
  withScope: jest.Mock<void, [(scope: MockSentryScope) => void]>;
  setUser: jest.Mock;
  setTag: jest.Mock;
  setExtra: jest.Mock;
  Severity: {
    Fatal: 'fatal';
    Error: 'error';
    Warning: 'warning';
    Info: 'info';
    Debug: 'debug';
  };
}

/**
 * Creates a fresh mock Sentry instance.
 * Call this in beforeEach if you need isolated mocks per test.
 */
export function createMockSentry(): MockSentry {
  const mockScope: MockSentryScope = {
    setExtra: jest.fn(),
    setTag: jest.fn(),
    setUser: jest.fn(),
    setLevel: jest.fn(),
    setContext: jest.fn(),
  };

  return {
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    init: jest.fn(),
    withScope: jest.fn((callback: (scope: MockSentryScope) => void) => {
      callback(mockScope);
    }),
    setUser: jest.fn(),
    setTag: jest.fn(),
    setExtra: jest.fn(),
    Severity: {
      Fatal: 'fatal',
      Error: 'error',
      Warning: 'warning',
      Info: 'info',
      Debug: 'debug',
    },
  };
}

/**
 * Default mock for use with jest.mock('@sentry/node', () => mockSentry).
 * Mocks are shared across tests - use createMockSentry() for isolation.
 */
export const mockSentry = createMockSentry();
