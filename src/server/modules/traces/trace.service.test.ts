import { EventEmitter2 } from '@nestjs/event-emitter';
import * as Sentry from '@sentry/node';
import * as fs from 'fs';
import { TraceService } from './trace.service';
import type {
  CreateTraceInput,
  ITraceService,
  ITraceRepository,
  TraceStatsResult,
  PhaseTiming,
  IRequestTrace,
} from './trace.types';

// Mock Sentry before importing anything that uses it
jest.mock('@sentry/node', () => ({
  captureMessage: jest.fn(),
}));

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  statSync: jest.fn().mockReturnValue({ size: 1024 * 1024 }), // 1 MB
}));

const mockedSentry = jest.mocked(Sentry);
const mockedFs = jest.mocked(fs);

describe('TraceService', () => {
  let service: ITraceService;
  let mockRepository: jest.Mocked<ITraceRepository>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  const mockTiming: PhaseTiming = {
    middleware: 1,
    guard: 2,
    interceptorPre: 1,
    handler: 10,
    interceptorPost: 1,
  };

  const mockTraceInput: CreateTraceInput = {
    traceId: 'test-trace-123',
    method: 'GET',
    path: '/api/test',
    statusCode: 200,
    durationMs: 15,
    timing: mockTiming,
    userAgent: 'test-agent',
    ip: '127.0.0.1',
  };

  const mockTrace: IRequestTrace = {
    traceId: 'test-trace-123',
    method: 'GET',
    path: '/api/test',
    statusCode: 200,
    durationMs: 15,
    timing: mockTiming,
    userId: undefined,
    userAgent: 'test-agent',
    ip: '127.0.0.1',
    timestamp: new Date(),
  };

  beforeEach(() => {
    mockRepository = {
      create: jest.fn().mockResolvedValue(mockTrace),
      findRecent: jest.fn().mockResolvedValue([mockTrace]),
      findById: jest.fn().mockResolvedValue(mockTrace),
      deleteOlderThan: jest.fn().mockResolvedValue(5),
      count: jest.fn().mockResolvedValue(100),
      getStats: jest.fn().mockResolvedValue({
        totalCount: 100,
        avgDuration: 25.5,
        errorRate: 2.5,
      } as TraceStatsResult),
      getHourlyStats: jest.fn().mockResolvedValue([]),
      getEndpointStats: jest.fn().mockResolvedValue([]),
    };

    mockEventEmitter = {
      emit: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<EventEmitter2>;

    service = new TraceService(mockRepository, mockEventEmitter);
  });

  describe('recordTrace', () => {
    it('should create a trace and emit event', async () => {
      const result = await service.recordTrace(mockTraceInput);

      expect(mockRepository.create).toHaveBeenCalledWith(mockTraceInput);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'trace.created',
        mockTrace,
      );
      expect(result).toEqual(mockTrace);
    });

    it('should include userId when provided', async () => {
      const inputWithUser = { ...mockTraceInput, userId: 42 };
      await service.recordTrace(inputWithUser);

      expect(mockRepository.create).toHaveBeenCalledWith(inputWithUser);
    });
  });

  describe('getRecentTraces', () => {
    it('should return recent traces from repository', async () => {
      const result = await service.getRecentTraces();

      expect(mockRepository.findRecent).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([mockTrace]);
    });

    it('should pass filters to repository', async () => {
      const filters = { method: 'GET', limit: 50 };
      await service.getRecentTraces(filters);

      expect(mockRepository.findRecent).toHaveBeenCalledWith(filters);
    });
  });

  describe('getTraceById', () => {
    it('should return trace by ID', async () => {
      const result = await service.getTraceById('test-trace-123');

      expect(mockRepository.findById).toHaveBeenCalledWith('test-trace-123');
      expect(result).toEqual(mockTrace);
    });

    it('should return null for non-existent trace', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      const result = await service.getTraceById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('cleanupOldTraces', () => {
    it('should delete traces older than TTL', async () => {
      const result = await service.cleanupOldTraces();

      expect(mockRepository.deleteOlderThan).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe('getTraceCount', () => {
    it('should return count from repository', async () => {
      const result = await service.getTraceCount();

      expect(mockRepository.count).toHaveBeenCalled();
      expect(result).toBe(100);
    });
  });

  describe('getStats', () => {
    it('should return stats from repository', async () => {
      const result = await service.getStats();

      expect(mockRepository.getStats).toHaveBeenCalled();
      expect(result).toEqual({
        totalCount: 100,
        avgDuration: 25.5,
        errorRate: 2.5,
      });
    });
  });

  describe('checkDatabaseSize', () => {
    it('should not alert when database is under threshold', async () => {
      await service.checkDatabaseSize();

      expect(mockedSentry.captureMessage).not.toHaveBeenCalled();
    });

    it('should alert when database exceeds threshold', async () => {
      // 35MB (over 30% of 100MB threshold)
      mockedFs.statSync.mockReturnValueOnce({
        size: 35 * 1024 * 1024,
      } as fs.Stats);

      await service.checkDatabaseSize();

      expect(mockedSentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining('Database size alert'),
        expect.objectContaining({
          level: 'warning',
          tags: expect.objectContaining({
            component: 'TraceService',
            alert: 'database-capacity',
          }),
        }),
      );
    });

    it('should handle missing database file gracefully', async () => {
      mockedFs.existsSync.mockReturnValueOnce(false);

      // Should not throw
      await expect(service.checkDatabaseSize()).resolves.not.toThrow();
    });

    it('should handle fs errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockedFs.statSync.mockImplementationOnce(() => {
        throw new Error('FS error');
      });

      await service.checkDatabaseSize();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to check database size'),
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});
