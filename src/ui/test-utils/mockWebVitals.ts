/**
 * Web Vitals test mock.
 *
 * The web-vitals library requires browser Performance APIs that aren't
 * fully implemented in jsdom. This mock provides no-op implementations.
 *
 * Usage:
 * This mock is applied globally in jest-preloaded.ts. No per-test setup needed.
 */

type MetricCallback = (metric: {
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
  navigationType: string;
}) => void;

/**
 * Mock metric callback registry.
 * Tests can use this to trigger metric reports.
 */
export const mockMetricCallbacks = {
  lcp: null as MetricCallback | null,
  inp: null as MetricCallback | null,
  cls: null as MetricCallback | null,
  fcp: null as MetricCallback | null,
  ttfb: null as MetricCallback | null,
};

/**
 * Simulate a metric being reported.
 */
export function simulateMetric(
  type: 'lcp' | 'inp' | 'cls' | 'fcp' | 'ttfb',
  value: number,
  rating: 'good' | 'needs-improvement' | 'poor' = 'good',
): void {
  const callback = mockMetricCallbacks[type];
  if (callback) {
    callback({
      name: type.toUpperCase(),
      value,
      rating,
      delta: value,
      id: `mock-${type}-${Date.now()}`,
      navigationType: 'navigate',
    });
  }
}

/**
 * Create a mock metric callback that stores the callback for later use.
 */
function createMockCallback(
  type: keyof typeof mockMetricCallbacks,
): (cb: MetricCallback) => void {
  return (cb: MetricCallback) => {
    mockMetricCallbacks[type] = cb;
  };
}

/**
 * Complete web-vitals mock module.
 */
export const mockWebVitals = {
  onLCP: createMockCallback('lcp'),
  onINP: createMockCallback('inp'),
  onCLS: createMockCallback('cls'),
  onFCP: createMockCallback('fcp'),
  onTTFB: createMockCallback('ttfb'),
};

/**
 * Reset all callbacks (call in afterEach if needed).
 */
export function resetWebVitalsMock(): void {
  mockMetricCallbacks.lcp = null;
  mockMetricCallbacks.inp = null;
  mockMetricCallbacks.cls = null;
  mockMetricCallbacks.fcp = null;
  mockMetricCallbacks.ttfb = null;
}
