/**
 * Unit tests for useNetworkTiming hook.
 *
 * These tests cover defensive browser compatibility branches that are
 * difficult to test in integration tests due to jsdom limitations.
 */

describe('useNetworkTiming defensive branches', () => {
  let mockSetState: jest.Mock;
  let effectCallback: (() => void | (() => void)) | null = null;

  beforeEach(() => {
    jest.resetModules();
    mockSetState = jest.fn();
    effectCallback = null;

    // Mock React hooks
    jest.doMock('react', () => ({
      useState: jest.fn((initial) => [initial, mockSetState]),
      useEffect: jest.fn((callback) => {
        effectCallback = callback;
      }),
    }));
  });

  afterEach(() => {
    jest.dontMock('react');
    jest.resetModules();
  });

  it('returns early when performance API is undefined', () => {
    // Save original
    const originalPerformance = global.performance;

    // Make performance undefined
    // @ts-expect-error - setting to undefined for test
    delete global.performance;

    // Import the hook with mocked React
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useNetworkTiming } = require('./useNetworkTiming');

    // Call the hook (this sets up the effect)
    useNetworkTiming();

    // Execute the effect callback
    expect(effectCallback).not.toBeNull();
    const cleanup = effectCallback!();

    // Should return undefined (early return)
    expect(cleanup).toBeUndefined();

    // setState should not have been called
    expect(mockSetState).not.toHaveBeenCalled();

    // Restore
    global.performance = originalPerformance;
  });

  it('adds load event listener when document.readyState is not complete', () => {
    // Save originals
    const originalReadyState = Object.getOwnPropertyDescriptor(
      document,
      'readyState',
    );

    // Mock readyState to 'loading'
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });

    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    // Mock performance.getEntriesByType
    const mockGetEntriesByType = jest.fn().mockReturnValue([]);
    Object.defineProperty(global.performance, 'getEntriesByType', {
      value: mockGetEntriesByType,
      configurable: true,
    });

    // Import the hook with mocked React
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useNetworkTiming } = require('./useNetworkTiming');

    // Call the hook
    useNetworkTiming();

    // Execute the effect callback
    expect(effectCallback).not.toBeNull();
    const cleanup = effectCallback!();

    // Should have added load event listener
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'load',
      expect.any(Function),
    );

    // Cleanup should be a function
    expect(typeof cleanup).toBe('function');

    // Execute cleanup
    cleanup!();

    // Should have removed the listener
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'load',
      expect.any(Function),
    );

    // Restore
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    if (originalReadyState) {
      Object.defineProperty(document, 'readyState', originalReadyState);
    }
  });

  it('collects timings immediately when document.readyState is complete', () => {
    // Save originals
    const originalReadyState = Object.getOwnPropertyDescriptor(
      document,
      'readyState',
    );

    // Mock readyState to 'complete'
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      configurable: true,
    });

    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    // Mock performance.getEntriesByType with entries that test branch coverage
    const mockResourceEntries = [
      {
        name: 'https://example.com/path/to/file.js', // Has path - pop() returns 'file.js'
        entryType: 'resource',
        startTime: 100,
        duration: 50,
        transferSize: 1000,
        decodedBodySize: 1000,
        initiatorType: 'script',
      },
      {
        name: 'no-path-file.js', // No slashes - pop() returns the whole string
        entryType: 'resource',
        startTime: 200,
        duration: 30,
        transferSize: 500,
        decodedBodySize: 500,
        initiatorType: 'script',
      },
      {
        name: '', // Empty string - pop() returns undefined, fallback to entry.name
        entryType: 'resource',
        startTime: 300,
        duration: 20,
        transferSize: 200,
        decodedBodySize: 200,
        initiatorType: 'other',
      },
    ];

    const mockNavEntries = [
      {
        domainLookupEnd: 100,
        domainLookupStart: 50,
        connectEnd: 200,
        connectStart: 100,
        secureConnectionStart: 0, // Tests the else branch (tlsNegotiation = 0)
        responseStart: 250,
        requestStart: 200,
        responseEnd: 300,
        domInteractive: 400,
        domContentLoadedEventEnd: 450,
        startTime: 0,
        loadEventEnd: 500,
      },
    ];

    const mockGetEntriesByType = jest.fn((type: string) => {
      if (type === 'resource') return mockResourceEntries;
      if (type === 'navigation') return mockNavEntries;
      return [];
    });
    Object.defineProperty(global.performance, 'getEntriesByType', {
      value: mockGetEntriesByType,
      configurable: true,
    });

    // Import the hook with mocked React
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useNetworkTiming } = require('./useNetworkTiming');

    // Call the hook
    useNetworkTiming();

    // Execute the effect callback
    expect(effectCallback).not.toBeNull();
    const cleanup = effectCallback!();

    // Should NOT have added load event listener
    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      'load',
      expect.any(Function),
    );

    // Cleanup should be undefined (no listener to remove)
    expect(cleanup).toBeUndefined();

    // Should have called getEntriesByType
    expect(mockGetEntriesByType).toHaveBeenCalledWith('resource');
    expect(mockGetEntriesByType).toHaveBeenCalledWith('navigation');

    // setState should have been called for resources and navigation
    expect(mockSetState).toHaveBeenCalled();

    // Restore
    addEventListenerSpy.mockRestore();
    if (originalReadyState) {
      Object.defineProperty(document, 'readyState', originalReadyState);
    }
  });

  it('handles secureConnectionStart > 0 for TLS timing', () => {
    // Save originals
    const originalReadyState = Object.getOwnPropertyDescriptor(
      document,
      'readyState',
    );

    // Mock readyState to 'complete'
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      configurable: true,
    });

    // Mock performance.getEntriesByType with TLS connection
    const mockNavEntries = [
      {
        domainLookupEnd: 100,
        domainLookupStart: 50,
        connectEnd: 200,
        connectStart: 100,
        secureConnectionStart: 150, // > 0, tests the if branch
        responseStart: 250,
        requestStart: 200,
        responseEnd: 300,
        domInteractive: 400,
        domContentLoadedEventEnd: 450,
        startTime: 0,
        loadEventEnd: 500,
      },
    ];

    const mockGetEntriesByType = jest.fn((type: string) => {
      if (type === 'navigation') return mockNavEntries;
      return [];
    });
    Object.defineProperty(global.performance, 'getEntriesByType', {
      value: mockGetEntriesByType,
      configurable: true,
    });

    // Import the hook with mocked React
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useNetworkTiming } = require('./useNetworkTiming');

    // Call the hook
    useNetworkTiming();

    // Execute the effect callback
    expect(effectCallback).not.toBeNull();
    effectCallback!();

    // Should have called getEntriesByType for navigation
    expect(mockGetEntriesByType).toHaveBeenCalledWith('navigation');

    // setState should have been called with TLS negotiation calculated
    expect(mockSetState).toHaveBeenCalled();

    // Restore
    if (originalReadyState) {
      Object.defineProperty(document, 'readyState', originalReadyState);
    }
  });
});
