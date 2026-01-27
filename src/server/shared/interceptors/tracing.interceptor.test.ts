import { TracingInterceptor } from './tracing.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import type { ITraceServicePort, CreateTraceInput } from 'server/shared/ports';

describe('TracingInterceptor', () => {
  let interceptor: TracingInterceptor;
  let mockTraceService: jest.Mocked<ITraceServicePort>;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockTraceService = {
      recordTrace: jest.fn().mockResolvedValue({
        traceId: 'test-id',
        method: 'GET',
        path: '/api/test',
        statusCode: 200,
        durationMs: 10,
        timing: {
          middleware: 0,
          guard: 0,
          interceptorPre: 0,
          handler: 10,
          interceptorPost: 0,
        },
        userAgent: 'test-agent',
        ip: '127.0.0.1',
        timestamp: new Date(),
      }),
    };

    mockRequest = {
      path: '/api/test',
      method: 'GET',
      headers: {
        'user-agent': 'test-agent',
      },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    };

    mockResponse = {
      statusCode: 200,
      setHeader: jest.fn(),
    };

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as jest.Mocked<ExecutionContext>;

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ result: 'success' })),
    };

    interceptor = new TracingInterceptor(mockTraceService);
  });

  describe('intercept', () => {
    it('should skip excluded paths', (done) => {
      mockRequest.path = '/api/health';

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockTraceService.recordTrace).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should skip trace stream endpoint', (done) => {
      mockRequest.path = '/api/traces/stream';

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockTraceService.recordTrace).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should skip non-API routes', (done) => {
      mockRequest.path = '/static/file.js';

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockTraceService.recordTrace).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should set X-Trace-Id header', (done) => {
      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Trace-Id',
            expect.any(String),
          );
          done();
        },
      });
    });

    it('should use existing trace ID from header', (done) => {
      mockRequest.headers['x-trace-id'] = 'existing-trace-id';

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'X-Trace-Id',
            'existing-trace-id',
          );
          expect(mockRequest.traceId).toBe('existing-trace-id');
          done();
        },
      });
    });

    it('should record successful trace', (done) => {
      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          // Wait for async recordTrace
          setImmediate(() => {
            expect(mockTraceService.recordTrace).toHaveBeenCalledWith(
              expect.objectContaining({
                method: 'GET',
                path: '/api/test',
                statusCode: 200,
                userAgent: 'test-agent',
              }),
            );
            done();
          });
        },
      });
    });

    it('should record error trace with status code', (done) => {
      const error = { status: 404, message: 'Not found' };
      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        error: () => {
          setImmediate(() => {
            expect(mockTraceService.recordTrace).toHaveBeenCalledWith(
              expect.objectContaining({
                statusCode: 404,
              }),
            );
            done();
          });
        },
      });
    });

    it('should default to 500 for errors without status', (done) => {
      const error = new Error('Something broke');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        error: () => {
          setImmediate(() => {
            expect(mockTraceService.recordTrace).toHaveBeenCalledWith(
              expect.objectContaining({
                statusCode: 500,
              }),
            );
            done();
          });
        },
      });
    });

    it('should extract user ID from authenticated request', (done) => {
      mockRequest.user = { userId: 42 };

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          setImmediate(() => {
            expect(mockTraceService.recordTrace).toHaveBeenCalledWith(
              expect.objectContaining({
                userId: 42,
              }),
            );
            done();
          });
        },
      });
    });

    it('should use x-forwarded-for header for IP', (done) => {
      mockRequest.headers['x-forwarded-for'] =
        '203.0.113.195, 70.41.3.18, 150.172.238.178';

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          setImmediate(() => {
            expect(mockTraceService.recordTrace).toHaveBeenCalledWith(
              expect.objectContaining({
                ip: '203.0.113.195',
              }),
            );
            done();
          });
        },
      });
    });

    it('should use x-forwarded-for array header for IP', (done) => {
      mockRequest.headers['x-forwarded-for'] = ['203.0.113.195', '70.41.3.18'];

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          setImmediate(() => {
            expect(mockTraceService.recordTrace).toHaveBeenCalledWith(
              expect.objectContaining({
                ip: '203.0.113.195',
              }),
            );
            done();
          });
        },
      });
    });

    it('should use request.ip when no x-forwarded-for', (done) => {
      delete mockRequest.headers['x-forwarded-for'];
      mockRequest.ip = '192.168.1.1';

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          setImmediate(() => {
            expect(mockTraceService.recordTrace).toHaveBeenCalledWith(
              expect.objectContaining({
                ip: '192.168.1.1',
              }),
            );
            done();
          });
        },
      });
    });

    it('should use socket remoteAddress as fallback for IP', (done) => {
      delete mockRequest.headers['x-forwarded-for'];
      mockRequest.ip = undefined;
      mockRequest.socket.remoteAddress = '10.0.0.1';

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          setImmediate(() => {
            expect(mockTraceService.recordTrace).toHaveBeenCalledWith(
              expect.objectContaining({
                ip: '10.0.0.1',
              }),
            );
            done();
          });
        },
      });
    });

    it('should return "unknown" when no IP available', (done) => {
      delete mockRequest.headers['x-forwarded-for'];
      mockRequest.ip = undefined;
      mockRequest.socket.remoteAddress = undefined;

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          setImmediate(() => {
            expect(mockTraceService.recordTrace).toHaveBeenCalledWith(
              expect.objectContaining({
                ip: 'unknown',
              }),
            );
            done();
          });
        },
      });
    });

    it('should use "unknown" for user-agent when not provided', (done) => {
      delete mockRequest.headers['user-agent'];

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          setImmediate(() => {
            expect(mockTraceService.recordTrace).toHaveBeenCalledWith(
              expect.objectContaining({
                userAgent: 'unknown',
              }),
            );
            done();
          });
        },
      });
    });

    it('should handle recordTrace failure gracefully', (done) => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockTraceService.recordTrace.mockRejectedValueOnce(new Error('DB error'));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          setImmediate(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
              expect.stringContaining('Failed to record trace'),
              expect.any(Error),
            );
            consoleSpy.mockRestore();
            done();
          });
        },
      });
    });

    it('should use traceContext phases for timing calculation', (done) => {
      // Set up request with traceContext containing handler start time
      mockRequest.traceContext = {
        phases: {
          handlerStart: performance.now() - 5, // Started 5ms ago
        },
      };

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          setImmediate(() => {
            const call = mockTraceService.recordTrace.mock
              .calls[0][0] as CreateTraceInput;
            // Verify timing was calculated using phases
            expect(call.timing.interceptorPre).toBeGreaterThan(0);
            expect(call.timing.handler).toBeGreaterThan(0);
            done();
          });
        },
      });
    });

    it('should handle traceContext with undefined handlerStart', (done) => {
      // To cover the fallback branches (context?.phases.handlerStart), we need to test
      // when handlerStart is undefined. The interceptor normally sets this, but we can
      // use a getter to make it return undefined when recordTrace reads it.
      let callCount = 0;
      Object.defineProperty(mockRequest, 'traceContext', {
        get() {
          callCount++;
          // Return phases with handlerStart on first reads (during setup),
          // but return phases with undefined handlerStart when recordTrace accesses it
          if (callCount <= 2) {
            return { startTime: performance.now(), phases: {} };
          }
          // After setup, return context with undefined handlerStart to trigger fallback
          return { phases: { handlerStart: undefined } };
        },
        set() {
          // Allow sets during interceptor setup
        },
        configurable: true,
      });

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          setImmediate(() => {
            const call = mockTraceService.recordTrace.mock
              .calls[0][0] as CreateTraceInput;
            // When handlerStart is undefined, interceptorPre falls back to 0
            expect(call.timing.interceptorPre).toBe(0);
            done();
          });
        },
      });
    });

    it('should handle missing traceContext entirely', (done) => {
      // To cover the case where traceContext is undefined/null,
      // we use a getter that returns undefined after initial setup
      let callCount = 0;
      Object.defineProperty(mockRequest, 'traceContext', {
        get() {
          callCount++;
          // Return valid context during setup (first 2 reads)
          if (callCount <= 2) {
            return { startTime: performance.now(), phases: {} };
          }
          // Return undefined when recordTrace accesses it to trigger fallback
          return undefined;
        },
        set() {
          // Allow sets during interceptor setup
        },
        configurable: true,
      });

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        complete: () => {
          setImmediate(() => {
            const call = mockTraceService.recordTrace.mock
              .calls[0][0] as CreateTraceInput;
            // When context is undefined, interceptorPre falls back to 0
            expect(call.timing.interceptorPre).toBe(0);
            done();
          });
        },
      });
    });
  });
});
