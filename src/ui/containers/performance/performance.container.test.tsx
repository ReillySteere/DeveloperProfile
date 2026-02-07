import React, { act } from 'react';
import { render, screen, waitFor } from 'ui/test-utils';
import { server } from 'ui/test-utils/msw';
import { createPerformanceHandlers } from 'ui/test-utils/msw/handlers';

jest.mock(
  'recharts',
  () =>
    jest.requireActual<typeof import('ui/test-utils/mockRecharts')>(
      'ui/test-utils/mockRecharts',
    ).mockRecharts,
);

jest.mock('web-vitals', () => ({
  onLCP: jest.fn(),
  onINP: jest.fn(),
  onCLS: jest.fn(),
  onFCP: jest.fn(),
  onTTFB: jest.fn(),
}));

// Mock performanceObserver with subscribe that invokes callback
const mockSubscribeCallback = jest.fn();
jest.mock('ui/shared/services/performanceObserver', () => ({
  performanceObserver: {
    getCurrentMetrics: jest.fn().mockReturnValue({}),
    subscribe: jest.fn((callback: (metric: unknown) => void) => {
      // Store callback and invoke it with a test metric to cover the callback code
      mockSubscribeCallback.mockImplementation(callback);
      // Invoke callback immediately for coverage
      setTimeout(() => {
        callback({
          name: 'LCP',
          value: 2500,
          rating: 'good',
          delta: 2500,
          id: 'test-metric',
          navigationType: 'navigate',
          timestamp: Date.now(),
        });
      }, 0);
      return jest.fn(); // unsubscribe function
    }),
    reportToServer: jest.fn(),
    getSessionId: jest.fn().mockReturnValue('test-session'),
  },
}));

import PerformanceContainer from './performance.container';
import { performanceObserver } from 'ui/shared/services/performanceObserver';

const mockGetCurrentMetrics =
  performanceObserver.getCurrentMetrics as jest.Mock;
const mockReportToServer = performanceObserver.reportToServer as jest.Mock;

// jsdom lacks performance.getEntriesByType
const mockGetEntriesByType = jest.fn().mockReturnValue([]);
beforeAll(() => {
  if (!performance.getEntriesByType) {
    Object.defineProperty(performance, 'getEntriesByType', {
      value: mockGetEntriesByType,
      writable: true,
      configurable: true,
    });
  } else {
    jest
      .spyOn(performance, 'getEntriesByType')
      .mockImplementation(mockGetEntriesByType);
  }
});

describe('PerformanceContainer', () => {
  beforeEach(() => {
    server.use(...createPerformanceHandlers({ scenario: 'success' }));
    mockGetCurrentMetrics.mockReturnValue({});
    mockGetEntriesByType.mockReturnValue([]);
    mockReportToServer.mockClear();
  });

  it('renders the performance observatory heading', () => {
    render(<PerformanceContainer />);
    expect(screen.getByText('Performance Observatory')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<PerformanceContainer />);
    expect(
      screen.getByText('Real-time performance monitoring for this site'),
    ).toBeInTheDocument();
  });

  it('shows collecting message when no vitals are available', () => {
    render(<PerformanceContainer />);
    expect(screen.getByText(/Collecting metrics/)).toBeInTheDocument();
  });

  it('renders benchmark chart when data loads', async () => {
    render(<PerformanceContainer />);

    await waitFor(() => {
      expect(screen.getByText('Industry Benchmarks')).toBeInTheDocument();
    });
  });

  it('displays bundle size treemap when bundle data is available', async () => {
    server.use(...createPerformanceHandlers({ scenario: 'with-bundle' }));

    render(<PerformanceContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('bundle-treemap')).toBeInTheDocument();
    });
  });

  it('handles browsers without Performance API gracefully', () => {
    const originalPerformance = window.performance;
    Object.defineProperty(window, 'performance', {
      value: undefined,
      writable: true,
    });

    render(<PerformanceContainer />);

    expect(
      screen.getByText('Performance API not supported in this browser.'),
    ).toBeInTheDocument();

    Object.defineProperty(window, 'performance', {
      value: originalPerformance,
      writable: true,
    });
  });

  it('renders memory chart component', () => {
    render(<PerformanceContainer />);
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
  });

  it('renders network waterfall component', () => {
    render(<PerformanceContainer />);
    expect(screen.getByText('Network Waterfall')).toBeInTheDocument();
  });

  it('renders core web vitals section', () => {
    render(<PerformanceContainer />);
    expect(screen.getByText('Core Web Vitals')).toBeInTheDocument();
  });

  it('reports metrics on visibility change to hidden', () => {
    render(<PerformanceContainer />);

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(mockReportToServer).toHaveBeenCalled();
  });

  it('does not report metrics when visibility changes to visible', () => {
    render(<PerformanceContainer />);

    mockReportToServer.mockClear();

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(mockReportToServer).not.toHaveBeenCalled();
  });

  it('renders web vital gauges when vitals data is present', () => {
    mockGetCurrentMetrics.mockReturnValue({
      lcp: {
        name: 'LCP',
        value: 2500,
        rating: 'good',
        delta: 2500,
        id: 'v1',
        navigationType: 'navigate',
        timestamp: Date.now(),
      },
      cls: {
        name: 'CLS',
        value: 0.05,
        rating: 'good',
        delta: 0.05,
        id: 'v2',
        navigationType: 'navigate',
        timestamp: Date.now(),
      },
      fcp: {
        name: 'FCP',
        value: 1500,
        rating: 'good',
        delta: 1500,
        id: 'v3',
        navigationType: 'navigate',
        timestamp: Date.now(),
      },
      inp: {
        name: 'INP',
        value: 200,
        rating: 'good',
        delta: 200,
        id: 'v4',
        navigationType: 'navigate',
        timestamp: Date.now(),
      },
      ttfb: {
        name: 'TTFB',
        value: 600,
        rating: 'good',
        delta: 600,
        id: 'v5',
        navigationType: 'navigate',
        timestamp: Date.now(),
      },
    });

    render(<PerformanceContainer />);

    expect(screen.getByTestId('lcp-gauge')).toBeInTheDocument();
    expect(screen.getByTestId('cls-gauge')).toBeInTheDocument();
    expect(screen.getByTestId('fcp-gauge')).toBeInTheDocument();
    expect(screen.getByTestId('inp-gauge')).toBeInTheDocument();
    expect(screen.getByTestId('ttfb-gauge')).toBeInTheDocument();
    // Score should render
    expect(screen.getByText('Performance Score')).toBeInTheDocument();
  });

  it('renders network waterfall with resource data', () => {
    mockGetEntriesByType.mockImplementation((type: string) => {
      if (type === 'resource') {
        return [
          {
            name: 'https://example.com/script.js',
            entryType: 'resource',
            startTime: 100,
            duration: 250,
            transferSize: 50000,
            decodedBodySize: 100000,
            initiatorType: 'script',
          },
        ] as unknown as PerformanceEntryList;
      }
      return [];
    });

    render(<PerformanceContainer />);

    expect(screen.getByText('Network Waterfall')).toBeInTheDocument();
  });

  it('renders network waterfall with navigation timing', () => {
    mockGetEntriesByType.mockImplementation((type: string) => {
      if (type === 'navigation') {
        return [
          {
            domainLookupStart: 0,
            domainLookupEnd: 10,
            connectStart: 10,
            connectEnd: 30,
            secureConnectionStart: 15,
            requestStart: 30,
            responseStart: 50,
            responseEnd: 100,
            domInteractive: 200,
            domContentLoadedEventEnd: 250,
            loadEventEnd: 300,
            startTime: 0,
          },
        ] as unknown as PerformanceEntryList;
      }
      return [];
    });

    render(<PerformanceContainer />);

    expect(screen.getByText('Network Waterfall')).toBeInTheDocument();
  });

  it('renders benchmark comparison with vitals for your site column', async () => {
    mockGetCurrentMetrics.mockReturnValue({
      lcp: {
        name: 'LCP',
        value: 2500,
        rating: 'good',
        delta: 2500,
        id: 'v1',
        navigationType: 'navigate',
        timestamp: Date.now(),
      },
    });

    render(<PerformanceContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('benchmark-chart')).toBeInTheDocument();
    });
  });

  it('renders memory chart with supported message when unsupported', () => {
    render(<PerformanceContainer />);

    expect(
      screen.getByText('Memory API is only available in Chromium browsers.'),
    ).toBeInTheDocument();
  });

  it('renders network waterfall with multiple resource types', () => {
    mockGetEntriesByType.mockImplementation((type: string) => {
      if (type === 'resource') {
        return [
          {
            name: 'https://example.com/very-long-filename-that-exceeds-thirty-characters.js',
            entryType: 'resource',
            startTime: 100,
            duration: 250,
            transferSize: 50000,
            decodedBodySize: 100000,
            initiatorType: 'script',
          },
          {
            name: 'https://example.com/styles.css',
            entryType: 'resource',
            startTime: 50,
            duration: 100,
            transferSize: 10000,
            decodedBodySize: 20000,
            initiatorType: 'css',
          },
          {
            name: 'https://example.com/image.png',
            entryType: 'resource',
            startTime: 200,
            duration: 300,
            transferSize: 100000,
            decodedBodySize: 150000,
            initiatorType: 'img',
          },
          {
            name: 'https://example.com/font.woff2',
            entryType: 'resource',
            startTime: 150,
            duration: 50,
            transferSize: 30000,
            decodedBodySize: 30000,
            initiatorType: 'font',
          },
          {
            name: 'https://example.com/api/data',
            entryType: 'resource',
            startTime: 300,
            duration: 200,
            transferSize: 5000,
            decodedBodySize: 5000,
            initiatorType: 'fetch',
          },
          {
            name: 'https://example.com/other.txt',
            entryType: 'resource',
            startTime: 400,
            duration: 50,
            transferSize: 1000,
            decodedBodySize: 1000,
            initiatorType: 'other',
          },
        ] as unknown as PerformanceEntryList;
      }
      return [];
    });

    render(<PerformanceContainer />);

    // Should show legend items for resource types
    expect(screen.getByText('script')).toBeInTheDocument();
    expect(screen.getByText('css')).toBeInTheDocument();
    expect(screen.getByText('img')).toBeInTheDocument();
  });

  it('renders benchmark comparison with null value handling', async () => {
    // Set vitals without lcp to test null value path in tooltip
    mockGetCurrentMetrics.mockReturnValue({
      fcp: {
        name: 'FCP',
        value: 1500,
        rating: 'good',
        delta: 1500,
        id: 'v3',
        navigationType: 'navigate',
        timestamp: Date.now(),
      },
    });

    render(<PerformanceContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('benchmark-chart')).toBeInTheDocument();
    });
  });

  it('handles page load event for network timing collection', () => {
    // Simulate document not yet loaded
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });

    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = render(<PerformanceContainer />);

    // Should have registered load event listener
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'load',
      expect.any(Function),
    );

    unmount();

    // Should have cleaned up
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'load',
      expect.any(Function),
    );

    // Restore
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      configurable: true,
    });
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});

// Direct component tests for coverage of internal rendering logic
describe('MemoryChart', () => {
  // Import component directly for isolated testing
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MemoryChart } = require('./components/MemoryChart');

  it('renders chart with memory samples', () => {
    const samples = [
      {
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 2048 * 1024 * 1024,
        timestamp: Date.now() - 5000,
      },
      {
        usedJSHeapSize: 55 * 1024 * 1024,
        totalJSHeapSize: 105 * 1024 * 1024,
        jsHeapSizeLimit: 2048 * 1024 * 1024,
        timestamp: Date.now(),
      },
    ];

    render(<MemoryChart samples={samples} isSupported={true} />);

    expect(screen.getByText(/Used:/)).toBeInTheDocument();
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
    expect(screen.getByText(/Limit:/)).toBeInTheDocument();
  });

  it('renders empty state when no samples', () => {
    render(<MemoryChart samples={[]} isSupported={true} />);

    expect(
      screen.getByText('Collecting memory samples...'),
    ).toBeInTheDocument();
  });
});

describe('NetworkWaterfall', () => {
  const { NetworkWaterfall } = jest.requireActual<
    typeof import('./components/NetworkWaterfall')
  >('./components/NetworkWaterfall');

  it('renders with resource data showing legend and bars', () => {
    const resources = [
      {
        name: 'script.js',
        entryType: 'resource',
        startTime: 100,
        duration: 250,
        transferSize: 50000,
        decodedBodySize: 100000,
        initiatorType: 'script',
      },
      {
        name: 'styles.css',
        entryType: 'resource',
        startTime: 50,
        duration: 100,
        transferSize: 10000,
        decodedBodySize: 20000,
        initiatorType: 'css',
      },
    ];

    render(<NetworkWaterfall resources={resources} />);

    expect(screen.getByText('script')).toBeInTheDocument();
    expect(screen.getByText('css')).toBeInTheDocument();
  });

  it('renders with unknown initiator type falling back to other color', () => {
    const resources = [
      {
        name: 'unknown.xyz',
        entryType: 'resource',
        startTime: 100,
        duration: 50,
        transferSize: 1000,
        decodedBodySize: 1000,
        initiatorType: 'unknown-type',
      },
    ];

    render(<NetworkWaterfall resources={resources} />);

    expect(screen.getByText('Network Waterfall')).toBeInTheDocument();
  });
});

describe('BundleSizeTreemap', () => {
  // Import with mocked recharts (SVG elements wrapped in <svg> to avoid jsdom warnings)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { BundleSizeTreemap } = require('./components/BundleSizeTreemap');

  it('renders treemap with module data', () => {
    const modules = [
      { name: 'react', size: 100000, gzippedSize: 30000 },
      { name: 'lodash', size: 80000, gzippedSize: 25000 },
    ];

    render(
      <BundleSizeTreemap
        modules={modules}
        totalSize={180000}
        gzippedSize={55000}
      />,
    );

    expect(screen.getByText('Bundle Size')).toBeInTheDocument();
    expect(screen.getByTestId('bundle-treemap')).toBeInTheDocument();
  });
});

describe('PerformanceScore re-exports', () => {
  it('exports calculateScore and getScoreColor', () => {
    const { calculateScore, getScoreColor } = jest.requireActual<
      typeof import('./components/PerformanceScore')
    >('./components/PerformanceScore');
    expect(calculateScore(2000, { good: 2500, poor: 4000 })).toBe(100);
    expect(getScoreColor(95)).toBe('#22c55e');
  });
});

describe('useMemoryUsage hook', () => {
  const originalMemory = Object.getOwnPropertyDescriptor(performance, 'memory');

  beforeEach(() => {
    jest.useFakeTimers();
    // Set up memory API mock
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 50 * 1024 * 1024,
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 2048 * 1024 * 1024,
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    // Restore original memory property
    if (originalMemory) {
      Object.defineProperty(performance, 'memory', originalMemory);
    } else {
      delete (performance as { memory?: unknown }).memory;
    }
  });

  it('collects memory samples when API is supported', async () => {
    // Import fresh hook (memory is already set up in beforeEach)
    const { useMemoryUsage } = jest.requireActual<
      typeof import('./hooks/useMemoryUsage')
    >('./hooks/useMemoryUsage');

    // Render a component that uses the hook
    const TestComponent = () => {
      const { samples, isSupported } = useMemoryUsage(1000);
      return (
        <div>
          <span data-testid="supported">{String(isSupported)}</span>
          <span data-testid="count">{samples.length}</span>
        </div>
      );
    };

    const { getByTestId, rerender } = render(<TestComponent />);

    // Initial render should have collected a sample
    expect(getByTestId('supported').textContent).toBe('true');
    expect(Number(getByTestId('count').textContent)).toBeGreaterThanOrEqual(1);

    // Advance timer and rerender to collect more samples
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    rerender(<TestComponent />);

    expect(Number(getByTestId('count').textContent)).toBeGreaterThanOrEqual(1);
  });

  it('cleans up interval on unmount', () => {
    const { useMemoryUsage } = jest.requireActual<
      typeof import('./hooks/useMemoryUsage')
    >('./hooks/useMemoryUsage');

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const TestComponent = () => {
      useMemoryUsage(1000);
      return <div>Test</div>;
    };

    const { unmount } = render(<TestComponent />);
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  // NOTE: The cleanup branch when isSupported=false (intervalRef is undefined)
  // is covered by istanbul ignore as it's a defensive browser compatibility check.
});

// NOTE: useNetworkTiming hook has browser-specific branches for:
// 1. typeof performance === 'undefined' - covered by istanbul ignore
// 2. document.readyState !== 'complete' - covered by istanbul ignore
// These are defensive checks for older browsers that are difficult to test
// in jsdom without breaking React's useState implementation.
