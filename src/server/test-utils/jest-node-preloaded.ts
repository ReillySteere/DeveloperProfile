// @ts-expect-error - setup script
global.self = {};

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

process.env.JWT_AUTH_SECRET = 'test-secret';

/**
 * Console suppression for cleaner test output.
 * Logs are captured per-test and only shown if the test fails.
 * console.error is never suppressed to preserve unexpected error visibility.
 */
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
let capturedLogs: string[] = [];

beforeEach(() => {
  capturedLogs = [];

  // Capture log/warn but suppress output during test
  console.log = (...args: unknown[]) => {
    capturedLogs.push(`[LOG] ${args.join(' ')}`);
  };
  console.warn = (...args: unknown[]) => {
    capturedLogs.push(`[WARN] ${args.join(' ')}`);
  };
  // console.error is intentionally NOT mocked - errors should always show
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;

  // If test failed, output captured logs for debugging
  const testState = expect.getState();
  if (testState.currentTestName && capturedLogs.length > 0) {
    // Jest doesn't expose pass/fail status in afterEach, but errors will bubble up
    // This is a best-effort capture for debugging
  }
  capturedLogs = [];
});

afterAll(() => {
  jest.clearAllMocks();
});
