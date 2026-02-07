/**
 * Shared types for the Performance Observatory feature.
 * Used by both frontend and backend.
 */

/** Rating category for a Web Vital metric */
export type WebVitalRating = 'good' | 'needs-improvement' | 'poor';

/** A single Web Vital metric measurement */
export interface WebVitalMetric {
  name: string;
  value: number;
  rating: WebVitalRating;
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
}

/** Core Web Vitals collection */
export interface WebVitals {
  lcp: WebVitalMetric;
  fid?: WebVitalMetric;
  inp: WebVitalMetric;
  cls: WebVitalMetric;
  fcp: WebVitalMetric;
  ttfb: WebVitalMetric;
}

/** Thresholds per Google's Web Vitals recommendations */
export const WEB_VITAL_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  inp: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
} as const;

/** Bundle module info */
export interface BundleModule {
  name: string;
  path: string;
  size: number;
  gzippedSize: number;
  isInitial: boolean;
  children?: BundleModule[];
}

/** Bundle analysis result */
export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  modules: BundleModule[];
  generatedAt: string;
}

/** Navigation timing breakdown */
export interface NavigationTiming {
  dnsLookup: number;
  tcpConnection: number;
  tlsNegotiation: number;
  requestTime: number;
  responseTime: number;
  domParsing: number;
  domContentLoaded: number;
  windowLoaded: number;
}

/** Resource loading timing */
export interface ResourceTiming {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  transferSize: number;
  decodedBodySize: number;
  initiatorType: string;
}

/** Network timing for current page */
export interface NetworkTiming {
  resources: ResourceTiming[];
  navigation: NavigationTiming;
}

/** Memory usage snapshot (Chrome-only) */
export interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

/** Performance report sent from client to server */
export interface PerformanceReportInput {
  sessionId: string;
  pageUrl: string;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
  webVitals: Partial<WebVitals>;
  navigationTiming?: NavigationTiming;
}

/** Stored performance report */
export interface PerformanceReportResult {
  id: string;
  sessionId: string;
  pageUrl: string;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
  webVitals: Partial<WebVitals>;
  navigationTiming?: NavigationTiming;
  timestamp: string;
}

/** Aggregated performance metrics response */
export interface AggregatedMetrics {
  totalReports: number;
  averageLcp: number;
  averageFcp: number;
  averageCls: number;
  averageTtfb: number;
  p75Lcp: number;
  p75Fcp: number;
  p75Cls: number;
  p75Ttfb: number;
}

/** Performance score calculation */
export interface PerformanceScore {
  overall: number;
  lcpScore: number;
  clsScore: number;
  fcpScore: number;
  breakdown: {
    category: string;
    score: number;
    weight: number;
  }[];
}

/** Industry benchmark data */
export interface Benchmark {
  metric: string;
  p50: number;
  p75: number;
  p90: number;
  source: string;
  industry: string;
  lastUpdated: string;
}
