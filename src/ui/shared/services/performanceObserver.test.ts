/**
 * Unit tests for PerformanceObserverService.
 *
 * This service wraps web-vitals and provides metrics collection/reporting.
 * We test the class with manual dependency injection, following the same
 * pattern used for server-side unit tests (see copilot-instructions.md).
 *
 * The class accepts dependencies via constructor, allowing full control
 * over web-vitals callbacks, axios, and browser APIs in tests.
 */
import type { Metric } from 'web-vitals';
import {
  PerformanceObserverService,
  PerformanceObserverDeps,
} from './performanceObserver';

/**
 * Creates mock dependencies for testing.
 * Each test can override specific deps as needed.
 */
function createMockDeps(
  overrides: Partial<PerformanceObserverDeps> = {},
): PerformanceObserverDeps & {
  triggerMetric: (type: string, value: number, rating?: string) => void;
  axiosPost: jest.Mock;
} {
  const metricCallbacks: Record<string, ((metric: Metric) => void) | null> = {
    LCP: null,
    INP: null,
    CLS: null,
    FCP: null,
    TTFB: null,
  };

  const axiosPost = jest.fn().mockResolvedValue({ data: { success: true } });

  const deps: PerformanceObserverDeps = {
    onLCP: (cb) => {
      metricCallbacks.LCP = cb;
    },
    onINP: (cb) => {
      metricCallbacks.INP = cb;
    },
    onCLS: (cb) => {
      metricCallbacks.CLS = cb;
    },
    onFCP: (cb) => {
      metricCallbacks.FCP = cb;
    },
    onTTFB: (cb) => {
      metricCallbacks.TTFB = cb;
    },
    axios: { post: axiosPost } as unknown as PerformanceObserverDeps['axios'],
    getNavigationEntries: () => [],
    getDoNotTrack: () => null,
    getPageUrl: () => '/test-page',
    getUserAgent: () => 'TestAgent/1.0',
    getConnectionType: () => '4g',
    getDeviceMemory: () => 8,
    ...overrides,
  };

  const triggerMetric = (
    type: string,
    value: number,
    rating: string = 'good',
  ) => {
    const metricName = type.toUpperCase() as
      | 'CLS'
      | 'FCP'
      | 'INP'
      | 'LCP'
      | 'TTFB';
    const callback = metricCallbacks[metricName];
    if (callback) {
      callback({
        name: metricName,
        value,
        rating: rating as 'good' | 'needs-improvement' | 'poor',
        delta: value,
        id: `mock-${type}-${Date.now()}`,
        navigationType: 'navigate',
        entries: [],
      });
    }
  };

  return { ...deps, triggerMetric, axiosPost };
}

describe('PerformanceObserverService', () => {
  describe('subscribe', () => {
    it('calls handler when a metric is reported', () => {
      const mockDeps = createMockDeps();
      const service = new PerformanceObserverService(mockDeps);
      const handler = jest.fn();

      service.subscribe(handler);
      mockDeps.triggerMetric('LCP', 2500, 'good');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'LCP',
          value: 2500,
          rating: 'good',
        }),
      );
    });

    it('calls multiple handlers for the same metric', () => {
      const mockDeps = createMockDeps();
      const service = new PerformanceObserverService(mockDeps);
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      service.subscribe(handler1);
      service.subscribe(handler2);
      mockDeps.triggerMetric('FCP', 1800, 'good');

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('returns an unsubscribe function that removes the handler', () => {
      const mockDeps = createMockDeps();
      const service = new PerformanceObserverService(mockDeps);
      const handler = jest.fn();

      const unsubscribe = service.subscribe(handler);
      mockDeps.triggerMetric('CLS', 0.1, 'good');
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      mockDeps.triggerMetric('CLS', 0.2, 'needs-improvement');
      expect(handler).toHaveBeenCalledTimes(1); // No additional calls
    });

    it('handles all metric types', () => {
      const mockDeps = createMockDeps();
      const service = new PerformanceObserverService(mockDeps);
      const handler = jest.fn();

      service.subscribe(handler);
      mockDeps.triggerMetric('LCP', 2500);
      mockDeps.triggerMetric('INP', 200);
      mockDeps.triggerMetric('CLS', 0.1);
      mockDeps.triggerMetric('FCP', 1800);
      mockDeps.triggerMetric('TTFB', 800);

      expect(handler).toHaveBeenCalledTimes(5);
    });
  });

  describe('getCurrentMetrics', () => {
    it('returns empty object initially', () => {
      const mockDeps = createMockDeps();
      const service = new PerformanceObserverService(mockDeps);

      const metrics = service.getCurrentMetrics();
      expect(metrics).toEqual({});
    });

    it('returns collected metrics after reporting', () => {
      const mockDeps = createMockDeps();
      const service = new PerformanceObserverService(mockDeps);

      mockDeps.triggerMetric('LCP', 2500, 'good');
      mockDeps.triggerMetric('FCP', 1800, 'good');

      const metrics = service.getCurrentMetrics();

      expect(metrics.lcp).toEqual(
        expect.objectContaining({
          name: 'LCP',
          value: 2500,
          rating: 'good',
        }),
      );
      expect(metrics.fcp).toEqual(
        expect.objectContaining({
          name: 'FCP',
          value: 1800,
          rating: 'good',
        }),
      );
    });

    it('returns a copy of metrics (not the internal reference)', () => {
      const mockDeps = createMockDeps();
      const service = new PerformanceObserverService(mockDeps);

      mockDeps.triggerMetric('LCP', 2500);

      const metrics1 = service.getCurrentMetrics();
      const metrics2 = service.getCurrentMetrics();

      expect(metrics1).not.toBe(metrics2);
      expect(metrics1).toEqual(metrics2);
    });
  });

  describe('getSessionId', () => {
    it('returns a session ID string', () => {
      const mockDeps = createMockDeps();
      const service = new PerformanceObserverService(mockDeps);

      const sessionId = service.getSessionId();

      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('returns consistent session ID across calls', () => {
      const mockDeps = createMockDeps();
      const service = new PerformanceObserverService(mockDeps);

      const sessionId1 = service.getSessionId();
      const sessionId2 = service.getSessionId();

      expect(sessionId1).toBe(sessionId2);
    });
  });

  describe('reportToServer', () => {
    it('sends metrics to the server', async () => {
      const mockDeps = createMockDeps();
      const service = new PerformanceObserverService(mockDeps);

      mockDeps.triggerMetric('LCP', 2500, 'good');
      await service.reportToServer();

      expect(mockDeps.axiosPost).toHaveBeenCalledTimes(1);
      expect(mockDeps.axiosPost).toHaveBeenCalledWith(
        '/api/performance/report',
        expect.objectContaining({
          sessionId: expect.any(String),
          pageUrl: '/test-page',
          userAgent: 'TestAgent/1.0',
          connectionType: '4g',
          deviceMemory: 8,
          webVitals: expect.objectContaining({
            lcp: expect.objectContaining({
              name: 'LCP',
              value: 2500,
            }),
          }),
        }),
      );
    });

    it('only reports once (subsequent calls are ignored)', async () => {
      const mockDeps = createMockDeps();
      const service = new PerformanceObserverService(mockDeps);

      await service.reportToServer();
      await service.reportToServer();
      await service.reportToServer();

      expect(mockDeps.axiosPost).toHaveBeenCalledTimes(1);
    });

    it('respects Do Not Track setting', async () => {
      const mockDeps = createMockDeps({
        getDoNotTrack: () => '1',
      });
      const service = new PerformanceObserverService(mockDeps);

      await service.reportToServer();

      expect(mockDeps.axiosPost).not.toHaveBeenCalled();
    });

    it('handles server errors gracefully and allows retry', async () => {
      const mockDeps = createMockDeps();
      mockDeps.axiosPost
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { success: true } });

      const service = new PerformanceObserverService(mockDeps);

      // First call fails
      await service.reportToServer();
      expect(mockDeps.axiosPost).toHaveBeenCalledTimes(1);

      // Should allow retry after failure
      await service.reportToServer();
      expect(mockDeps.axiosPost).toHaveBeenCalledTimes(2);
    });

    it('includes navigation timing when available', async () => {
      const mockNavigationTiming = {
        domainLookupEnd: 100,
        domainLookupStart: 50,
        connectEnd: 200,
        connectStart: 100,
        secureConnectionStart: 150,
        responseStart: 300,
        requestStart: 200,
        responseEnd: 400,
        domInteractive: 500,
        domContentLoadedEventEnd: 600,
        startTime: 0,
        loadEventEnd: 700,
      } as unknown as PerformanceNavigationTiming;

      const mockDeps = createMockDeps({
        getNavigationEntries: () => [mockNavigationTiming],
      });
      const service = new PerformanceObserverService(mockDeps);

      await service.reportToServer();

      expect(mockDeps.axiosPost).toHaveBeenCalledWith(
        '/api/performance/report',
        expect.objectContaining({
          navigationTiming: {
            dnsLookup: 50,
            tcpConnection: 100,
            tlsNegotiation: 50,
            requestTime: 100,
            responseTime: 100,
            domParsing: 100,
            domContentLoaded: 600,
            windowLoaded: 700,
          },
        }),
      );
    });

    it('handles missing navigation timing entries', async () => {
      const mockDeps = createMockDeps({
        getNavigationEntries: () => [],
      });
      const service = new PerformanceObserverService(mockDeps);

      await service.reportToServer();

      expect(mockDeps.axiosPost).toHaveBeenCalledWith(
        '/api/performance/report',
        expect.objectContaining({
          navigationTiming: undefined,
        }),
      );
    });

    it('handles zero secureConnectionStart (non-HTTPS)', async () => {
      const mockNavigationTiming = {
        domainLookupEnd: 100,
        domainLookupStart: 50,
        connectEnd: 200,
        connectStart: 100,
        secureConnectionStart: 0, // No TLS
        responseStart: 300,
        requestStart: 200,
        responseEnd: 400,
        domInteractive: 500,
        domContentLoadedEventEnd: 600,
        startTime: 0,
        loadEventEnd: 700,
      } as unknown as PerformanceNavigationTiming;

      const mockDeps = createMockDeps({
        getNavigationEntries: () => [mockNavigationTiming],
      });
      const service = new PerformanceObserverService(mockDeps);

      await service.reportToServer();

      expect(mockDeps.axiosPost).toHaveBeenCalledWith(
        '/api/performance/report',
        expect.objectContaining({
          navigationTiming: expect.objectContaining({
            tlsNegotiation: 0,
          }),
        }),
      );
    });

    it('handles undefined connection type and device memory', async () => {
      const mockDeps = createMockDeps({
        getConnectionType: () => undefined,
        getDeviceMemory: () => undefined,
      });
      const service = new PerformanceObserverService(mockDeps);

      await service.reportToServer();

      expect(mockDeps.axiosPost).toHaveBeenCalledWith(
        '/api/performance/report',
        expect.objectContaining({
          connectionType: undefined,
          deviceMemory: undefined,
        }),
      );
    });
  });

  describe('defaultDeps', () => {
    it('provides browser API accessors that return expected values', () => {
      // Polyfill performance.getEntriesByType for jsdom
      if (!performance.getEntriesByType) {
        Object.defineProperty(performance, 'getEntriesByType', {
          value: () => [],
          configurable: true,
          writable: true,
        });
      }

      // Import defaultDeps to exercise the inline functions
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { defaultDeps } = require('./performanceObserver');

      // Exercise each getter function to ensure coverage
      // These return actual browser values (or undefined in jsdom)
      expect(typeof defaultDeps.getNavigationEntries).toBe('function');
      expect(typeof defaultDeps.getDoNotTrack).toBe('function');
      expect(typeof defaultDeps.getPageUrl).toBe('function');
      expect(typeof defaultDeps.getUserAgent).toBe('function');
      expect(typeof defaultDeps.getConnectionType).toBe('function');
      expect(typeof defaultDeps.getDeviceMemory).toBe('function');

      // Call each function to exercise coverage
      const navEntries = defaultDeps.getNavigationEntries();
      expect(Array.isArray(navEntries)).toBe(true);

      // doNotTrack can be null, undefined, '1', '0', or 'unspecified' depending on browser
      const dnt = defaultDeps.getDoNotTrack();
      expect(dnt === null || dnt === undefined || typeof dnt === 'string').toBe(
        true,
      );

      // pageUrl is a string (pathname)
      const pageUrl = defaultDeps.getPageUrl();
      expect(typeof pageUrl).toBe('string');

      // userAgent is a string
      const userAgent = defaultDeps.getUserAgent();
      expect(typeof userAgent).toBe('string');

      // connectionType may be undefined in jsdom
      const connectionType = defaultDeps.getConnectionType();
      expect(
        connectionType === undefined || typeof connectionType === 'string',
      ).toBe(true);

      // deviceMemory may be undefined in jsdom
      const deviceMemory = defaultDeps.getDeviceMemory();
      expect(
        deviceMemory === undefined || typeof deviceMemory === 'number',
      ).toBe(true);
    });
  });
});
