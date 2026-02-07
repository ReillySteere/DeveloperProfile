import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { PerformanceReport, BundleSnapshot } from './performance.entity';
import { PerformanceRepository } from './performance.repository';
import { PerformanceService } from './performance.service';
import { PerformanceController } from './performance.controller';
import TOKENS from './tokens';
import { PERFORMANCE_EVENTS } from './events';
import type { PerformanceReportInput } from 'shared/types';
import {
  testSseStream,
  createMockEventEmitter,
} from 'server/test-utils/mockEventEmitter';

describe('Performance Module Integration', () => {
  let module: TestingModule;
  let controller: PerformanceController;
  let service: PerformanceService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [PerformanceReport, BundleSnapshot],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([PerformanceReport, BundleSnapshot]),
        EventEmitterModule.forRoot(),
        ScheduleModule.forRoot(),
      ],
      controllers: [PerformanceController],
      providers: [
        {
          provide: TOKENS.IPerformanceRepository,
          useClass: PerformanceRepository,
        },
        {
          provide: TOKENS.IPerformanceService,
          useClass: PerformanceService,
        },
      ],
    }).compile();

    controller = module.get<PerformanceController>(PerformanceController);
    service = module.get<PerformanceService>(TOKENS.IPerformanceService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Metric reporting', () => {
    it('accepts and stores a performance report', async () => {
      const report: PerformanceReportInput = {
        sessionId: 'test-session-123',
        pageUrl: '/home',
        userAgent: 'Mozilla/5.0 Test',
        webVitals: {
          lcp: {
            name: 'LCP',
            value: 2000,
            rating: 'good',
            delta: 2000,
            id: 'lcp-1',
            navigationType: 'navigate',
            timestamp: Date.now(),
          },
        },
      };

      const result = await controller.reportMetrics(report);
      expect(result.id).toBeDefined();
      expect(result.sessionId).toBe('test-session-123');
      expect(result.pageUrl).toBe('/home');
    });

    it('stores multiple reports and retrieves aggregated metrics', async () => {
      // Add another report with different values
      await controller.reportMetrics({
        sessionId: 'test-session-456',
        pageUrl: '/about',
        userAgent: 'Mozilla/5.0 Test',
        webVitals: {
          lcp: {
            name: 'LCP',
            value: 3000,
            rating: 'needs-improvement',
            delta: 3000,
            id: 'lcp-2',
            navigationType: 'navigate',
            timestamp: Date.now(),
          },
          fcp: {
            name: 'FCP',
            value: 1500,
            rating: 'good',
            delta: 1500,
            id: 'fcp-1',
            navigationType: 'navigate',
            timestamp: Date.now(),
          },
        },
      });

      const metrics = await controller.getMetrics();
      expect(metrics.totalReports).toBeGreaterThanOrEqual(2);
      expect(metrics.averageLcp).toBeGreaterThan(0);
    });

    it('aggregates all four web vital metrics', async () => {
      // Add a report with all four metrics to cover all branches
      await controller.reportMetrics({
        sessionId: 'test-session-all-vitals',
        pageUrl: '/complete',
        userAgent: 'Mozilla/5.0 Test',
        webVitals: {
          lcp: {
            name: 'LCP',
            value: 2500,
            rating: 'good',
            delta: 2500,
            id: 'lcp-3',
            navigationType: 'navigate',
            timestamp: Date.now(),
          },
          fcp: {
            name: 'FCP',
            value: 1200,
            rating: 'good',
            delta: 1200,
            id: 'fcp-2',
            navigationType: 'navigate',
            timestamp: Date.now(),
          },
          cls: {
            name: 'CLS',
            value: 0.08,
            rating: 'good',
            delta: 0.08,
            id: 'cls-1',
            navigationType: 'navigate',
            timestamp: Date.now(),
          },
          ttfb: {
            name: 'TTFB',
            value: 450,
            rating: 'good',
            delta: 450,
            id: 'ttfb-1',
            navigationType: 'navigate',
            timestamp: Date.now(),
          },
        },
      });

      const metrics = await controller.getMetrics('/complete');
      expect(metrics.totalReports).toBe(1);
      expect(metrics.averageLcp).toBe(2500);
      expect(metrics.averageFcp).toBe(1200);
      expect(metrics.averageCls).toBe(0.08);
      expect(metrics.averageTtfb).toBe(450);
    });

    it('filters aggregated metrics by page', async () => {
      const metrics = await controller.getMetrics('/home');
      expect(metrics.totalReports).toBeGreaterThanOrEqual(1);
    });

    it('filters aggregated metrics by days parameter', async () => {
      // Test with explicit days parameter to cover parseInt branch
      const metrics = await controller.getMetrics(undefined, '7');
      expect(metrics).toBeDefined();
      expect(metrics.totalReports).toBeGreaterThanOrEqual(0);
    });

    it('returns zero metrics when no reports exist for page', async () => {
      // Query a page with no reports to cover the empty reports branch
      const metrics = await controller.getMetrics('/non-existent-page-12345');
      expect(metrics.totalReports).toBe(0);
      expect(metrics.averageLcp).toBe(0);
      expect(metrics.averageFcp).toBe(0);
      expect(metrics.averageCls).toBe(0);
      expect(metrics.averageTtfb).toBe(0);
      expect(metrics.p75Lcp).toBe(0);
      expect(metrics.p75Fcp).toBe(0);
      expect(metrics.p75Cls).toBe(0);
      expect(metrics.p75Ttfb).toBe(0);
    });

    it('accepts report with navigation timing', async () => {
      const result = await controller.reportMetrics({
        sessionId: 'test-session-789',
        pageUrl: '/projects',
        userAgent: 'Mozilla/5.0 Test',
        connectionType: '4g',
        deviceMemory: 8,
        webVitals: {
          cls: {
            name: 'CLS',
            value: 0.05,
            rating: 'good',
            delta: 0.05,
            id: 'cls-1',
            navigationType: 'navigate',
            timestamp: Date.now(),
          },
        },
        navigationTiming: {
          dnsLookup: 5,
          tcpConnection: 10,
          tlsNegotiation: 15,
          requestTime: 50,
          responseTime: 100,
          domParsing: 200,
          domContentLoaded: 350,
          windowLoaded: 500,
        },
      });

      expect(result.connectionType).toBe('4g');
      expect(result.deviceMemory).toBe(8);
      expect(result.navigationTiming).toBeDefined();
    });

    it('aggregates metrics for reports with partial vitals', async () => {
      // Get metrics for /projects which only has cls (no lcp, fcp, ttfb)
      // This covers the false branches for missing metrics in the loop
      const metrics = await controller.getMetrics('/projects');
      expect(metrics.totalReports).toBe(1);
      expect(metrics.averageCls).toBe(0.05);
      // These should be 0 since reports don't have these metrics
      expect(metrics.averageLcp).toBe(0);
      expect(metrics.averageFcp).toBe(0);
      expect(metrics.averageTtfb).toBe(0);
    });
  });

  describe('Benchmarks', () => {
    it('returns industry benchmark data', () => {
      const benchmarks = controller.getBenchmarks();
      expect(benchmarks.length).toBeGreaterThan(0);
      expect(benchmarks[0]).toHaveProperty('metric');
      expect(benchmarks[0]).toHaveProperty('p75');
      expect(benchmarks[0]).toHaveProperty('source');
    });
  });

  describe('Bundle snapshots', () => {
    it('returns null when no bundle snapshot exists', async () => {
      const bundle = await controller.getLatestBundle();
      expect(bundle).toBeNull();
    });

    it('stores and retrieves bundle snapshot', async () => {
      await service.saveBundleSnapshot({
        totalSize: 500000,
        gzippedSize: 150000,
        modules: [
          {
            name: 'main',
            path: 'dist/main.js',
            size: 300000,
            gzippedSize: 90000,
            isInitial: true,
          },
          {
            name: 'vendor',
            path: 'dist/vendor.js',
            size: 200000,
            gzippedSize: 60000,
            isInitial: true,
          },
        ],
        generatedAt: new Date().toISOString(),
      });

      const bundle = await controller.getLatestBundle();
      expect(bundle).not.toBeNull();
      expect(bundle!.totalSize).toBe(500000);
      expect(bundle!.modules).toHaveLength(2);
    });
  });

  describe('Cleanup', () => {
    it('cleans up old reports', async () => {
      const deleted = await service.cleanupOldReports();
      // All reports are recent, so none should be deleted
      expect(deleted).toBe(0);
    });
  });
});

describe('PerformanceController SSE stream', () => {
  let controller: PerformanceController;
  let mockEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(() => {
    mockEmitter = createMockEventEmitter();

    const mockService = {
      reportMetrics: jest.fn(),
      getAggregatedMetrics: jest.fn(),
      getBenchmarks: jest.fn(),
      getLatestBundle: jest.fn(),
      saveBundleSnapshot: jest.fn(),
    };

    controller = new PerformanceController(mockService, mockEmitter);
  });

  it('transforms performance.reported events to MessageEvent format', async () => {
    const testReport = {
      id: 'test-id',
      sessionId: 'session-1',
      pageUrl: '/home',
      webVitals: { lcp: { name: 'LCP', value: 2000, rating: 'good' } },
    };

    const result = await testSseStream(
      controller.streamMetrics(),
      mockEmitter,
      PERFORMANCE_EVENTS.PERFORMANCE_REPORTED,
      testReport,
    );

    expect(result).toEqual({ data: testReport });
    expect(result.data).toHaveProperty('id', 'test-id');
  });
});
