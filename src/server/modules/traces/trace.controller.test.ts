import { TraceController } from './trace.controller';
import {
  createMockEventEmitter,
  testSseStream,
} from 'server/test-utils/mockEventEmitter';
import type { ITraceService } from './trace.service';
import type { TraceAlertService } from './trace-alert.service';
import type { RequestTrace } from './trace.entity';
import type { AlertEvent, AlertRule } from './alert.config';
import { TRACE_EVENTS } from './events';

/**
 * Unit tests for TraceController SSE streams.
 * Uses mockEventEmitter utility to test event transformations.
 *
 * These tests verify the map callbacks in streamTraces() and streamAlerts()
 * correctly transform events to MessageEvent format.
 */
describe('TraceController SSE streams', () => {
  let controller: TraceController;
  let mockEmitter: ReturnType<typeof createMockEventEmitter>;
  let mockTraceService: jest.Mocked<ITraceService>;
  let mockAlertService: jest.Mocked<TraceAlertService>;

  beforeEach(() => {
    mockEmitter = createMockEventEmitter();

    mockTraceService = {
      recordTrace: jest.fn(),
      getTraceById: jest.fn(),
      getRecentTraces: jest.fn(),
      getStats: jest.fn(),
      getHourlyStats: jest.fn(),
      getEndpointStats: jest.fn(),
      getTraceCount: jest.fn(),
      cleanupOldTraces: jest.fn(),
    } as unknown as jest.Mocked<ITraceService>;

    mockAlertService = {
      getAlertRules: jest.fn().mockReturnValue([]),
      getRecentAlerts: jest.fn(),
      getUnresolvedAlerts: jest.fn(),
      resolveAlert: jest.fn(),
    } as unknown as jest.Mocked<TraceAlertService>;

    controller = new TraceController(
      mockTraceService,
      mockAlertService,
      mockEmitter,
    );
  });

  describe('streamTraces', () => {
    it('should transform trace.created events to MessageEvent format', async () => {
      const testTrace: Partial<RequestTrace> = {
        traceId: 'test-trace-123',
        method: 'GET',
        path: '/api/test',
        statusCode: 200,
        durationMs: 50,
      };

      const result = await testSseStream(
        controller.streamTraces(),
        mockEmitter,
        TRACE_EVENTS.TRACE_CREATED,
        testTrace,
      );

      expect(result).toEqual({ data: testTrace });
      expect(result.data).toHaveProperty('traceId', 'test-trace-123');
    });

    it('should preserve all trace properties in transformation', async () => {
      const fullTrace: Partial<RequestTrace> = {
        traceId: 'full-trace-456',
        method: 'POST',
        path: '/api/users',
        statusCode: 201,
        durationMs: 120,
        userAgent: 'Jest Test',
        ip: '127.0.0.1',
        timing: {
          middleware: 5,
          guard: 10,
          interceptorPre: 2,
          handler: 100,
          interceptorPost: 3,
        },
      };

      const result = await testSseStream(
        controller.streamTraces(),
        mockEmitter,
        TRACE_EVENTS.TRACE_CREATED,
        fullTrace,
      );

      expect(result.data).toEqual(fullTrace);
    });
  });

  describe('streamAlerts', () => {
    it('should transform alert.triggered events to MessageEvent format', async () => {
      const testRule: AlertRule = {
        name: 'Test Alert',
        metric: 'avgDuration',
        threshold: 100,
        windowMinutes: 5,
        cooldownMinutes: 30,
        channels: ['log'],
        enabled: true,
      };

      const alertEvent: AlertEvent = {
        rule: testRule,
        currentValue: 150,
        triggeredAt: new Date(),
        context: {
          windowMinutes: 5,
          totalRequests: 100,
        },
      };

      const result = await testSseStream(
        controller.streamAlerts(),
        mockEmitter,
        TRACE_EVENTS.ALERT_TRIGGERED,
        alertEvent,
      );

      expect(result).toEqual({ data: alertEvent });
      const data = result.data as AlertEvent;
      expect(data).toHaveProperty('rule');
      expect(data.rule.name).toBe('Test Alert');
      expect(data).toHaveProperty('currentValue', 150);
    });

    it('should preserve alert context in transformation', async () => {
      const alertEvent: AlertEvent = {
        rule: {
          name: 'High Error Rate',
          metric: 'errorRate',
          threshold: 5,
          windowMinutes: 10,
          cooldownMinutes: 60,
          channels: ['sentry', 'email'],
          enabled: true,
        },
        currentValue: 8.5,
        triggeredAt: new Date('2026-01-26T12:00:00Z'),
        context: {
          windowMinutes: 10,
          totalRequests: 500,
        },
      };

      const result = await testSseStream(
        controller.streamAlerts(),
        mockEmitter,
        TRACE_EVENTS.ALERT_TRIGGERED,
        alertEvent,
      );

      const data = result.data as AlertEvent;
      expect(data.context.windowMinutes).toBe(10);
      expect(data.context.totalRequests).toBe(500);
    });
  });
});
