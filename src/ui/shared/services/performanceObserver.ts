import { onLCP, onCLS, onFCP, onTTFB, onINP } from 'web-vitals';
import type { Metric } from 'web-vitals';
import type { WebVitalMetric, WebVitals, NavigationTiming } from 'shared/types';
import axios, { AxiosInstance } from 'axios';

type MetricHandler = (metric: WebVitalMetric) => void;

/**
 * Web Vitals observer callback type.
 * Matches the signature of web-vitals onXXX functions.
 */
export type VitalsCallback = (onReport: (metric: Metric) => void) => void;

/**
 * Dependencies for PerformanceObserverService.
 * Allows injection for testing.
 */
export interface PerformanceObserverDeps {
  onLCP: VitalsCallback;
  onINP: VitalsCallback;
  onCLS: VitalsCallback;
  onFCP: VitalsCallback;
  onTTFB: VitalsCallback;
  axios: AxiosInstance;
  getNavigationEntries: () => PerformanceEntry[];
  getDoNotTrack: () => string | null;
  getPageUrl: () => string;
  getUserAgent: () => string;
  getConnectionType: () => string | undefined;
  getDeviceMemory: () => number | undefined;
}

/**
 * Default dependencies using real browser APIs.
 */
export const defaultDeps: PerformanceObserverDeps = {
  onLCP,
  onINP,
  onCLS,
  onFCP,
  onTTFB,
  axios,
  getNavigationEntries: () => performance.getEntriesByType('navigation'),
  getDoNotTrack: () => navigator.doNotTrack,
  getPageUrl: () => window.location.pathname,
  getUserAgent: () => navigator.userAgent,
  getConnectionType: () =>
    (navigator as Navigator & { connection?: { effectiveType: string } })
      .connection?.effectiveType,
  getDeviceMemory: () =>
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
};

export class PerformanceObserverService {
  #handlers: Set<MetricHandler> = new Set();
  #metrics: Partial<WebVitals> = {};
  #sessionId: string;
  #reported = false;
  #deps: PerformanceObserverDeps;

  constructor(deps: PerformanceObserverDeps = defaultDeps) {
    this.#deps = deps;
    this.#sessionId = this.#generateSessionId();
    this.#initObservers();
  }

  #initObservers(): void {
    const reportMetric = (metric: Metric) => {
      const webVitalMetric: WebVitalMetric = {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        timestamp: Date.now(),
      };

      this.#metrics[metric.name.toLowerCase() as keyof WebVitals] =
        webVitalMetric;
      this.#handlers.forEach((handler) => handler(webVitalMetric));
    };

    this.#deps.onLCP(reportMetric);
    this.#deps.onINP(reportMetric);
    this.#deps.onCLS(reportMetric);
    this.#deps.onFCP(reportMetric);
    this.#deps.onTTFB(reportMetric);
  }

  subscribe(handler: MetricHandler): () => void {
    this.#handlers.add(handler);
    return () => this.#handlers.delete(handler);
  }

  getCurrentMetrics(): Partial<WebVitals> {
    return { ...this.#metrics };
  }

  getSessionId(): string {
    return this.#sessionId;
  }

  async reportToServer(): Promise<void> {
    if (this.#reported) return;

    // Respect Do Not Track
    if (this.#deps.getDoNotTrack() === '1') return;

    this.#reported = true;

    try {
      await this.#deps.axios.post('/api/performance/report', {
        sessionId: this.#sessionId,
        pageUrl: this.#deps.getPageUrl(),
        userAgent: this.#deps.getUserAgent(),
        connectionType: this.#deps.getConnectionType(),
        deviceMemory: this.#deps.getDeviceMemory(),
        webVitals: this.#metrics,
        navigationTiming: this.#getNavigationTiming(),
      });
    } catch {
      // Silent failure — don't impact user experience
      this.#reported = false;
    }
  }

  #getNavigationTiming(): NavigationTiming | undefined {
    const entries = this.#deps.getNavigationEntries();
    if (entries.length === 0) return undefined;

    const timing = entries[0] as PerformanceNavigationTiming;

    return {
      dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
      tcpConnection: timing.connectEnd - timing.connectStart,
      tlsNegotiation:
        timing.secureConnectionStart > 0
          ? timing.connectEnd - timing.secureConnectionStart
          : 0,
      requestTime: timing.responseStart - timing.requestStart,
      responseTime: timing.responseEnd - timing.responseStart,
      domParsing: timing.domInteractive - timing.responseEnd,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.startTime,
      windowLoaded: timing.loadEventEnd - timing.startTime,
    };
  }

  #generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const performanceObserver = new PerformanceObserverService();
