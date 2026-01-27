import { Repository, type SelectQueryBuilder } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TraceAlertService } from './trace-alert.service';
import { AlertHistory } from './alert-history.entity';
import type { ITraceRepository, HourlyStatsResult } from './trace.types';
import type { AlertRule } from './alert.config';
import type { LoggerService } from 'server/shared/adapters/logger';
import {
  type IAlertChannel,
  SentryAlertChannel,
  LogAlertChannel,
  EmailAlertChannel,
} from './channels';

/**
 * Unit tests for TraceAlertService edge cases.
 * Uses manual dependency injection per project conventions.
 *
 * These tests cover:
 * - Error handling paths (try/catch)
 * - Disabled rules being skipped
 * - Channel send failures
 * - p95Duration metric
 *
 * Integration tests cover the happy paths through the module.
 */
describe('TraceAlertService (edge cases)', () => {
  let service: TraceAlertService;
  let mockRepository: jest.Mocked<ITraceRepository>;
  let mockAlertHistoryRepo: jest.Mocked<Repository<AlertHistory>>;
  let mockLogger: jest.Mocked<LoggerService>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockSentryChannel: jest.Mocked<IAlertChannel>;
  let mockLogChannel: jest.Mocked<IAlertChannel>;
  let mockEmailChannel: jest.Mocked<IAlertChannel>;

  const mockHourlyStats: HourlyStatsResult[] = [
    {
      hour: new Date().toISOString(),
      count: 100,
      avgDuration: 50,
      errorRate: 2,
      p95Duration: 100,
    },
  ];

  const createQueryBuilderMock = () =>
    ({
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    }) as unknown as jest.Mocked<SelectQueryBuilder<AlertHistory>>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findRecent: jest.fn(),
      findById: jest.fn(),
      deleteOlderThan: jest.fn(),
      count: jest.fn(),
      getStats: jest.fn().mockResolvedValue({
        totalCount: 100,
        avgDuration: 50,
        errorRate: 2,
      }),
      getHourlyStats: jest.fn().mockResolvedValue(mockHourlyStats),
      getEndpointStats: jest.fn(),
    };

    mockAlertHistoryRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((data) => data),
      save: jest
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock()),
    } as unknown as jest.Mocked<Repository<AlertHistory>>;

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    mockSentryChannel = {
      channelId: 'sentry',
      isEnabled: jest.fn().mockReturnValue(true),
      send: jest.fn().mockResolvedValue(undefined),
    };

    mockLogChannel = {
      channelId: 'log',
      isEnabled: jest.fn().mockReturnValue(true),
      send: jest.fn().mockResolvedValue(undefined),
    };

    mockEmailChannel = {
      channelId: 'email',
      isEnabled: jest.fn().mockReturnValue(false),
      send: jest.fn().mockResolvedValue(undefined),
    };

    service = new TraceAlertService(
      mockRepository,
      mockAlertHistoryRepo,
      mockLogger,
      mockEventEmitter,
      mockSentryChannel as unknown as SentryAlertChannel,
      mockLogChannel as unknown as LogAlertChannel,
      mockEmailChannel as unknown as EmailAlertChannel,
    );
  });

  describe('onModuleInit', () => {
    it('should log initialization with rule count', () => {
      service.onModuleInit();

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('initialized with'),
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('rules'),
      );
    });
  });

  describe('checkAlerts - error handling', () => {
    it('should log error when rule evaluation throws', async () => {
      // Mock getHourlyStats to throw only on specific calls
      mockRepository.getHourlyStats.mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      await service.checkAlerts();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error evaluating rule'),
      );
    });

    // Note: 'skip disabled rules' is tested via integration tests
    // which use the default config containing a disabled rule
  });

  describe('triggerAlert - channel error handling', () => {
    const testRule: AlertRule = {
      name: 'Test Alert',
      metric: 'avgDuration',
      threshold: 100,
      windowMinutes: 5,
      cooldownMinutes: 30,
      channels: ['sentry', 'log'],
      enabled: true,
    };

    it('should log error when channel send fails', async () => {
      mockSentryChannel.send.mockRejectedValueOnce(
        new Error('Sentry unavailable'),
      );

      await service.triggerAlert(testRule, 150);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send to sentry'),
      );
      // Log channel should still be called
      expect(mockLogChannel.send).toHaveBeenCalled();
    });
  });

  describe('getMetricValue - p95Duration', () => {
    it('should correctly extract p95Duration metric', async () => {
      const p95Rule: AlertRule = {
        name: 'P95 Test',
        metric: 'p95Duration',
        threshold: 50,
        windowMinutes: 5,
        cooldownMinutes: 30,
        channels: ['log'],
        enabled: true,
      };

      // Set p95 to be above threshold
      mockRepository.getHourlyStats.mockResolvedValue([
        {
          hour: new Date().toISOString(),
          count: 100,
          avgDuration: 50,
          errorRate: 2,
          p95Duration: 200,
        },
      ]);

      const result = await service.evaluateRule(p95Rule);

      expect(result.currentValue).toBe(200);
      expect(result.triggered).toBe(true);
    });
  });

  describe('getWindowStats - fallback', () => {
    it('should fall back to overall stats when no hourly data', async () => {
      // Return empty hourly stats
      mockRepository.getHourlyStats.mockResolvedValue([]);

      const testRule: AlertRule = {
        name: 'Fallback Test',
        metric: 'avgDuration',
        threshold: 40,
        windowMinutes: 5,
        cooldownMinutes: 30,
        channels: ['log'],
        enabled: true,
      };

      const result = await service.evaluateRule(testRule);

      // Should have called getStats as fallback
      expect(mockRepository.getStats).toHaveBeenCalled();
      // Value should come from the mocked getStats (avgDuration: 50)
      expect(result.currentValue).toBe(50);
    });
  });

  describe('cleanupOldAlerts - with deletions', () => {
    it('should log when alerts are cleaned up', async () => {
      const qb = createQueryBuilderMock();
      qb.execute.mockResolvedValue({ affected: 5 });
      mockAlertHistoryRepo.createQueryBuilder.mockReturnValue(qb);

      const deleted = await service.cleanupOldAlerts();

      expect(deleted).toBe(5);
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up 5'),
      );
    });

    it('should handle undefined affected count', async () => {
      const qb = createQueryBuilderMock();
      // Simulate when affected is undefined
      qb.execute.mockResolvedValue({ affected: undefined });
      mockAlertHistoryRepo.createQueryBuilder.mockReturnValue(qb);

      const deleted = await service.cleanupOldAlerts();

      // Should default to 0 via nullish coalescing
      expect(deleted).toBe(0);
    });
  });
});
