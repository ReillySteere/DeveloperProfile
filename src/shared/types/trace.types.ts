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
