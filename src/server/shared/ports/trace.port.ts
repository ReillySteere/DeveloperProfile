/**
 * Port interface for trace operations.
 *
 * This defines the contract that the tracing adapter must implement.
 * Shared interceptors should depend on this interface, not the concrete implementation.
 */

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
 * Input for creating a new trace.
 */
export interface CreateTraceInput {
  traceId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timing: PhaseTiming;
  userId?: number;
  userAgent: string;
  ip: string;
}

/**
 * Request trace data (interface for use without TypeORM dependency).
 */
export interface IRequestTrace {
  traceId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timing: PhaseTiming;
  userId?: number;
  userAgent: string;
  ip: string;
  timestamp: Date;
}

/**
 * Service port interface for trace operations.
 * Used by shared interceptors to record trace data.
 */
export interface ITraceServicePort {
  recordTrace(input: CreateTraceInput): Promise<IRequestTrace>;
}

/**
 * Injection token for trace service.
 */
export const TRACE_SERVICE_TOKEN = Symbol('TraceService');
