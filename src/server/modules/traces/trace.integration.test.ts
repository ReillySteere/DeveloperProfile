import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TraceModule } from './trace.module';
import { ITraceService, CreateTraceInput } from './trace.service';
import { RequestTrace, PhaseTiming } from './trace.entity';
import { TraceController } from './trace.controller';
import { User } from 'server/shared/modules/auth/user.entity';
import TOKENS from './tokens';

describe('Trace Integration', () => {
  let module: TestingModule;
  let service: ITraceService;
  let controller: TraceController;

  const mockTiming: PhaseTiming = {
    middleware: 1,
    guard: 2,
    interceptorPre: 1,
    handler: 10,
    interceptorPost: 1,
  };

  const createTraceInput = (
    overrides: Partial<CreateTraceInput> = {},
  ): CreateTraceInput => ({
    traceId: `trace-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    method: 'GET',
    path: '/api/test',
    statusCode: 200,
    durationMs: 15,
    timing: mockTiming,
    userAgent: 'jest-test',
    ip: '127.0.0.1',
    ...overrides,
  });

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [RequestTrace, User],
          synchronize: true,
        }),
        EventEmitterModule.forRoot(),
        ScheduleModule.forRoot(),
        TraceModule,
      ],
    }).compile();

    service = module.get<ITraceService>(TOKENS.ITraceService);
    controller = module.get<TraceController>(TraceController);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('TraceService', () => {
    it('should record and retrieve a trace', async () => {
      const input = createTraceInput();
      const recorded = await service.recordTrace(input);

      expect(recorded.traceId).toBe(input.traceId);
      expect(recorded.method).toBe(input.method);
      expect(recorded.path).toBe(input.path);
      expect(recorded.statusCode).toBe(input.statusCode);
      expect(recorded.durationMs).toBe(input.durationMs);
    });

    it('should get recent traces without any filters', async () => {
      const traces = await service.getRecentTraces();
      expect(Array.isArray(traces)).toBe(true);
    });

    it('should retrieve trace by ID', async () => {
      const input = createTraceInput();
      await service.recordTrace(input);

      const retrieved = await service.getTraceById(input.traceId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.traceId).toBe(input.traceId);
    });

    it('should filter traces by method', async () => {
      // Create traces with different methods
      await service.recordTrace(createTraceInput({ method: 'GET' }));
      await service.recordTrace(createTraceInput({ method: 'POST' }));
      await service.recordTrace(createTraceInput({ method: 'GET' }));

      const getTraces = await service.getRecentTraces({ method: 'POST' });

      expect(getTraces.every((t) => t.method === 'POST')).toBe(true);
    });

    it('should filter traces by path', async () => {
      await service.recordTrace(createTraceInput({ path: '/api/users' }));
      await service.recordTrace(createTraceInput({ path: '/api/posts' }));

      const traces = await service.getRecentTraces({ path: 'users' });

      expect(traces.length).toBeGreaterThan(0);
      expect(traces.every((t) => t.path.includes('users'))).toBe(true);
    });

    it('should filter traces by status code', async () => {
      await service.recordTrace(createTraceInput({ statusCode: 200 }));
      await service.recordTrace(createTraceInput({ statusCode: 404 }));

      const traces = await service.getRecentTraces({ statusCode: 404 });

      expect(traces.every((t) => t.statusCode === 404)).toBe(true);
    });

    it('should filter traces by min duration', async () => {
      await service.recordTrace(createTraceInput({ durationMs: 5 }));
      await service.recordTrace(createTraceInput({ durationMs: 100 }));

      const traces = await service.getRecentTraces({ minDuration: 50 });

      expect(traces.every((t) => t.durationMs >= 50)).toBe(true);
    });

    it('should filter traces by max duration', async () => {
      await service.recordTrace(createTraceInput({ durationMs: 5 }));
      await service.recordTrace(createTraceInput({ durationMs: 100 }));

      const traces = await service.getRecentTraces({ maxDuration: 50 });

      expect(traces.every((t) => t.durationMs <= 50)).toBe(true);
    });

    it('should respect offset parameter', async () => {
      const traces1 = await service.getRecentTraces({ limit: 5, offset: 0 });
      const traces2 = await service.getRecentTraces({ limit: 5, offset: 2 });

      // Offset should skip traces
      expect(traces1.length).toBeGreaterThanOrEqual(traces2.length);
    });

    it('should return trace count', async () => {
      const count = await service.getTraceCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('should return stats', async () => {
      const stats = await service.getStats();

      expect(stats.totalCount).toBeGreaterThan(0);
      expect(typeof stats.avgDuration).toBe('number');
      expect(typeof stats.errorRate).toBe('number');
    });

    it('should return hourly stats', async () => {
      const hourlyStats = await service.getHourlyStats(24);

      expect(Array.isArray(hourlyStats)).toBe(true);
      // Should have at least one hour bucket since we've recorded traces
      if (hourlyStats.length > 0) {
        const first = hourlyStats[0];
        expect(first).toHaveProperty('hour');
        expect(first).toHaveProperty('count');
        expect(first).toHaveProperty('avgDuration');
        expect(first).toHaveProperty('errorRate');
        expect(first).toHaveProperty('p95Duration');
      }
    });

    it('should return hourly stats with custom hours param', async () => {
      const hourlyStats = await service.getHourlyStats(1);
      expect(Array.isArray(hourlyStats)).toBe(true);
    });

    it('should return endpoint stats', async () => {
      const endpointStats = await service.getEndpointStats(10);

      expect(Array.isArray(endpointStats)).toBe(true);
      if (endpointStats.length > 0) {
        const first = endpointStats[0];
        expect(first).toHaveProperty('path');
        expect(first).toHaveProperty('method');
        expect(first).toHaveProperty('count');
        expect(first).toHaveProperty('avgDuration');
        expect(first).toHaveProperty('errorRate');
      }
    });

    it('should group endpoint stats by method and path', async () => {
      // Create traces with same path, different methods
      await service.recordTrace(
        createTraceInput({ method: 'GET', path: '/api/endpoint-test' }),
      );
      await service.recordTrace(
        createTraceInput({ method: 'POST', path: '/api/endpoint-test' }),
      );
      await service.recordTrace(
        createTraceInput({ method: 'GET', path: '/api/endpoint-test' }),
      );

      const endpointStats = await service.getEndpointStats(50);

      // Should have separate entries for GET and POST
      const getEntry = endpointStats.find(
        (e) => e.path === '/api/endpoint-test' && e.method === 'GET',
      );
      const postEntry = endpointStats.find(
        (e) => e.path === '/api/endpoint-test' && e.method === 'POST',
      );

      expect(getEntry).toBeDefined();
      expect(postEntry).toBeDefined();
      expect(getEntry!.count).toBe(2);
      expect(postEntry!.count).toBe(1);
    });

    it('should calculate error rate in hourly stats', async () => {
      // Create one success and one error trace
      await service.recordTrace(
        createTraceInput({ statusCode: 200, path: '/api/error-test' }),
      );
      await service.recordTrace(
        createTraceInput({ statusCode: 500, path: '/api/error-test' }),
      );

      const hourlyStats = await service.getHourlyStats(24);

      expect(hourlyStats.length).toBeGreaterThan(0);
      // At least one bucket should have non-zero error rate
      const hasErrors = hourlyStats.some((h) => h.errorRate > 0);
      expect(hasErrors).toBe(true);
    });
  });

  describe('TraceController', () => {
    it('should return traces via getTraces', async () => {
      const result = await controller.getTraces();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter traces by method', async () => {
      const result = await controller.getTraces('GET');

      expect(result.every((t) => t.method === 'GET')).toBe(true);
    });

    it('should return trace by ID', async () => {
      const traces = await controller.getTraces();
      const traceId = traces[0].traceId;

      const result = await controller.getTraceById(traceId);

      expect(result.traceId).toBe(traceId);
    });

    it('should throw NotFoundException for non-existent trace', async () => {
      await expect(controller.getTraceById('non-existent-id')).rejects.toThrow(
        'Trace non-existent-id not found',
      );
    });

    it('should return stats', async () => {
      const stats = await controller.getStats();

      expect(stats).toHaveProperty('totalCount');
      expect(stats).toHaveProperty('avgDuration');
      expect(stats).toHaveProperty('errorRate');
    });

    it('should return hourly stats', async () => {
      const hourlyStats = await controller.getHourlyStats();

      expect(Array.isArray(hourlyStats)).toBe(true);
    });

    it('should return hourly stats with custom hours', async () => {
      const hourlyStats = await controller.getHourlyStats('12');

      expect(Array.isArray(hourlyStats)).toBe(true);
    });

    it('should return endpoint stats', async () => {
      const endpointStats = await controller.getEndpointStats();

      expect(Array.isArray(endpointStats)).toBe(true);
    });

    it('should return endpoint stats with custom limit', async () => {
      const endpointStats = await controller.getEndpointStats('5');

      expect(Array.isArray(endpointStats)).toBe(true);
    });

    it('should filter traces with all parameters', async () => {
      const result = await controller.getTraces(
        'GET',
        '/api',
        '200',
        '0',
        '1000',
        '10',
        '0',
      );

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return an observable for stream', () => {
      const result = controller.streamTraces();

      expect(result).toBeDefined();
      expect(typeof result.subscribe).toBe('function');
    });

    it('should clear traces via DELETE', async () => {
      // First create a trace
      await service.recordTrace(createTraceInput());

      // Then clear
      const result = await controller.clearTraces();

      expect(result).toHaveProperty('deleted');
      expect(typeof result.deleted).toBe('number');
    });
  });
});
