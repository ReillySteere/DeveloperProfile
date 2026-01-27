import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import type { ITraceServicePort, CreateTraceInput } from 'server/shared/ports';
import { TRACE_SERVICE_TOKEN } from 'server/shared/ports';

/** Paths to exclude from tracing */
const EXCLUDED_PATHS = ['/api/health', '/api/traces/stream'];

interface TraceContext {
  startTime: number;
  phases: {
    guardStart?: number;
    guardEnd?: number;
    handlerStart?: number;
    handlerEnd?: number;
  };
}

/** Extend Express Request to include trace context */
interface TracedRequest extends Request {
  traceId?: string;
  traceContext?: TraceContext;
}

/**
 * Global interceptor that captures request telemetry.
 * Records timing, status codes, and metadata for the observability dashboard.
 *
 * Excludes:
 * - /api/health (to avoid noise from health checks)
 * - /api/traces/stream (to avoid recursive tracing of SSE)
 *
 * @see architecture/components/traces.md
 */
@Injectable()
export class TracingInterceptor implements NestInterceptor {
  readonly #traceService: ITraceServicePort;

  constructor(
    @Inject(TRACE_SERVICE_TOKEN)
    traceService: ITraceServicePort,
  ) {
    this.#traceService = traceService;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<TracedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    // Skip excluded paths
    if (this.shouldExclude(request.path)) {
      return next.handle();
    }

    // Skip non-API routes
    if (!request.path.startsWith('/api/')) {
      return next.handle();
    }

    // Initialize trace context
    const traceId = (request.headers['x-trace-id'] as string) || randomUUID();
    const startTime = performance.now();

    request.traceId = traceId;
    request.traceContext = {
      startTime,
      phases: {},
    };

    // Set trace ID in response header
    response.setHeader('X-Trace-Id', traceId);

    // Mark handler start
    request.traceContext.phases.handlerStart = performance.now();

    return next.handle().pipe(
      tap(() => {
        this.recordTrace(request, response, startTime, 'success');
      }),
      catchError((error) => {
        this.recordTrace(request, response, startTime, 'error', error);
        return throwError(() => error);
      }),
    );
  }

  private shouldExclude(path: string): boolean {
    return EXCLUDED_PATHS.some((excluded) => path.startsWith(excluded));
  }

  private recordTrace(
    request: TracedRequest,
    response: Response,
    startTime: number,
    outcome: 'success' | 'error',
    error?: Error,
  ): void {
    const endTime = performance.now();
    const durationMs = endTime - startTime;
    const context = request.traceContext;

    // Calculate phase timings (simplified - full breakdown requires middleware instrumentation)
    const handlerDuration = context?.phases.handlerStart
      ? endTime - context.phases.handlerStart
      : durationMs;

    const input: CreateTraceInput = {
      traceId: request.traceId!,
      method: request.method,
      path: request.path,
      statusCode:
        outcome === 'error'
          ? ((error as Error & { status?: number })?.status ?? 500)
          : response.statusCode,
      durationMs: Math.round(durationMs * 100) / 100, // Round to 2 decimal places
      timing: {
        middleware: 0, // Would require middleware instrumentation
        guard: 0, // Would require guard instrumentation
        interceptorPre: context?.phases.handlerStart
          ? context.phases.handlerStart - startTime
          : 0,
        handler: handlerDuration,
        interceptorPost: 0, // Minimal in practice
      },
      userId: (request as TracedRequest & { user?: { userId?: number } }).user
        ?.userId,
      userAgent: request.headers['user-agent'] || 'unknown',
      ip: this.getClientIp(request),
    };

    // Fire and forget - don't block response
    this.#traceService.recordTrace(input).catch((err: Error) => {
      console.error('[TracingInterceptor] Failed to record trace:', err);
    });
  }

  private getClientIp(request: TracedRequest): string {
    // Check common proxy headers
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(',')[0];
      return ips.trim();
    }

    return request.ip || request.socket.remoteAddress || 'unknown';
  }
}
