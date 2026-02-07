import { onLCP, onCLS, onFCP, onTTFB, onINP } from 'web-vitals';
import type { Metric } from 'web-vitals';
import type { WebVitalMetric, WebVitals, NavigationTiming } from 'shared/types';
import axios from 'axios';

type MetricHandler = (metric: WebVitalMetric) => void;

class PerformanceObserverService {
  #handlers: Set<MetricHandler> = new Set();
  #metrics: Partial<WebVitals> = {};
  #sessionId: string;
  #reported = false;

  constructor() {
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

    onLCP(reportMetric);
    onINP(reportMetric);
    onCLS(reportMetric);
    onFCP(reportMetric);
    onTTFB(reportMetric);
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
    if (navigator.doNotTrack === '1') return;

    this.#reported = true;

    try {
      await axios.post('/api/performance/report', {
        sessionId: this.#sessionId,
        pageUrl: window.location.pathname,
        userAgent: navigator.userAgent,
        connectionType: (
          navigator as Navigator & {
            connection?: { effectiveType: string };
          }
        ).connection?.effectiveType,
        deviceMemory: (navigator as Navigator & { deviceMemory?: number })
          .deviceMemory,
        webVitals: this.#metrics,
        navigationTiming: this.#getNavigationTiming(),
      });
    } catch {
      // Silent failure — don't impact user experience
      this.#reported = false;
    }
  }

  #getNavigationTiming(): NavigationTiming | undefined {
    const entries = performance.getEntriesByType('navigation');
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
