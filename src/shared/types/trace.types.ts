/**
 * Phase timing breakdown for request lifecycle.
 * Each phase represents a distinct part of the NestJS request pipeline.
 */
export interface PhaseTiming {
  /** Time spent in middleware (ms) */
  middleware: number;
  /** Time spent in guards (ms) */
  guard: number;
  /** Time spent in interceptor pre-handler (ms) */
  interceptorPre: number;
  /** Time spent in route handler (ms) */
  handler: number;
  /** Time spent in interceptor post-handler (ms) */
  interceptorPost: number;
}

/**
 * Request trace data returned from API.
 */
export interface RequestTrace {
  /** UUID correlation ID for the request */
  traceId: string;
  /** HTTP method (GET, POST, PUT, DELETE, etc.) */
  method: string;
  /** Request path (e.g., /api/experience) */
  path: string;
  /** HTTP status code returned */
  statusCode: number;
  /** Total request duration in milliseconds */
  durationMs: number;
  /** Breakdown of time spent in each pipeline phase */
  timing: PhaseTiming;
  /** User ID if authenticated (null for anonymous requests) */
  userId?: number;
  /** Client user agent string */
  userAgent: string;
  /** Client IP address */
  ip: string;
  /** When the request was received (ISO string) */
  timestamp: string;
}

/**
 * Filter options for querying traces.
 */
export interface TraceFilters {
  method?: string;
  path?: string;
  statusCode?: number;
  minDuration?: number;
  maxDuration?: number;
  limit?: number;
  offset?: number;
}

/**
 * Trace statistics from the API.
 */
export interface TraceStats {
  /** Total number of traces in the time window */
  totalCount: number;
  /** Average duration in milliseconds */
  avgDuration: number;
  /** Error rate as percentage (0-100) */
  errorRate: number;
}

/**
 * Hourly trace statistics for trend visualization.
 */
export interface TraceHourlyStats {
  /** Hour as ISO timestamp (e.g., "2026-01-25T14:00:00.000Z") */
  hour: string;
  /** Number of requests in this hour */
  count: number;
  /** Average request duration in milliseconds */
  avgDuration: number;
  /** Error rate as percentage (0-100) */
  errorRate: number;
  /** 95th percentile duration in milliseconds */
  p95Duration: number;
}

/**
 * Per-endpoint statistics for breakdown visualization.
 */
export interface TraceEndpointStats {
  /** Request path (e.g., "/api/blog") */
  path: string;
  /** HTTP method */
  method: string;
  /** Total request count */
  count: number;
  /** Average request duration in milliseconds */
  avgDuration: number;
  /** Error rate as percentage (0-100) */
  errorRate: number;
}

/**
 * Alert rule configuration.
 */
export interface AlertRule {
  /** Human-readable name for the alert */
  name: string;
  /** Metric to monitor */
  metric: 'avgDuration' | 'errorRate' | 'p95Duration';
  /** Threshold value that triggers the alert */
  threshold: number;
  /** Time window in minutes to evaluate */
  windowMinutes: number;
  /** Cooldown period in minutes before re-alerting */
  cooldownMinutes: number;
  /** Channels to send alerts to */
  channels: string[];
  /** Whether the alert is enabled */
  enabled: boolean;
}

/**
 * Alert history record from the API.
 */
export interface AlertHistoryRecord {
  id: number;
  ruleName: string;
  metric: string;
  threshold: number;
  actualValue: number;
  triggeredAt: string;
  channels: string[];
  resolved: boolean;
  resolvedAt?: string;
  notes?: string;
}
