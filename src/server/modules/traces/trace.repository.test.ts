import { Repository } from 'typeorm';
import { TraceRepository } from './trace.repository';
import { RequestTrace } from './trace.entity';

/**
 * Unit tests for TraceRepository defensive branches.
 * These test edge cases that are difficult to reproduce with integration tests,
 * specifically nullish coalescing fallbacks for database query results.
 */
describe('TraceRepository (Unit)', () => {
  let repository: TraceRepository;
  let mockRepo: jest.Mocked<Repository<RequestTrace>>;
  let mockQueryBuilder: any;

  beforeEach(() => {
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
    };

    mockRepo = {
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<RequestTrace>>;

    repository = new TraceRepository(mockRepo);
  });

  describe('deleteOlderThan', () => {
    it('should return 0 when affected is undefined', async () => {
      // Covers the ?? 0 branch on line 88
      mockRepo.delete.mockResolvedValue({ affected: undefined, raw: {} });

      const result = await repository.deleteOlderThan(new Date());

      expect(result).toBe(0);
    });

    it('should return 0 when affected is null', async () => {
      // Covers the ?? 0 branch on line 88
      mockRepo.delete.mockResolvedValue({
        affected: null as unknown as number,
        raw: {},
      });

      const result = await repository.deleteOlderThan(new Date());

      expect(result).toBe(0);
    });

    it('should return affected count when defined', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 5, raw: {} });

      const result = await repository.deleteOlderThan(new Date());

      expect(result).toBe(5);
    });
  });

  describe('getStats', () => {
    it('should return zeros when result is null', async () => {
      // Covers the result?.totalCount ?? '0' branches on lines 109-111
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      const stats = await repository.getStats();

      expect(stats).toEqual({
        totalCount: 0,
        avgDuration: 0,
        errorRate: 0,
      });
    });

    it('should return zeros when result is undefined', async () => {
      // Covers the result?.totalCount ?? '0' branches on lines 109-111
      mockQueryBuilder.getRawOne.mockResolvedValue(undefined);

      const stats = await repository.getStats();

      expect(stats).toEqual({
        totalCount: 0,
        avgDuration: 0,
        errorRate: 0,
      });
    });

    it('should return zeros when result properties are null', async () => {
      // Covers each ?? '0' branch when individual properties are null
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalCount: null,
        avgDuration: null,
        errorRate: null,
      });

      const stats = await repository.getStats();

      expect(stats).toEqual({
        totalCount: 0,
        avgDuration: 0,
        errorRate: 0,
      });
    });

    it('should parse valid stats correctly', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalCount: '100',
        avgDuration: '25.5',
        errorRate: '5.0',
      });

      const stats = await repository.getStats();

      expect(stats).toEqual({
        totalCount: 100,
        avgDuration: 25.5,
        errorRate: 5.0,
      });
    });
  });

  describe('getHourlyStats', () => {
    it('should use default hours parameter (24)', async () => {
      // Covers the default parameter branch on line 117
      mockRepo.find.mockResolvedValue([]);

      await repository.getHourlyStats();

      expect(mockRepo.find).toHaveBeenCalled();
    });

    it('should return empty array when no traces', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await repository.getHourlyStats(24);

      expect(result).toEqual([]);
    });

    it('should calculate p95 with fallback to 0 for empty buckets', async () => {
      // Test p95Duration ?? 0 fallback in the mapping logic
      const now = new Date();
      mockRepo.find.mockResolvedValue([
        {
          traceId: 'trace-1',
          timestamp: now,
          durationMs: 100,
          statusCode: 200,
        } as RequestTrace,
      ]);

      const result = await repository.getHourlyStats(24);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('p95Duration');
    });
  });

  describe('getEndpointStats', () => {
    it('should use default limit parameter (20)', async () => {
      // Covers the default parameter branch on line 173
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await repository.getEndpointStats();

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
    });

    it('should return 0 errorRate when null', async () => {
      // Covers the errorRate ?? '0' branch on line 200
      mockQueryBuilder.getRawMany.mockResolvedValue([
        {
          path: '/api/test',
          method: 'GET',
          count: '10',
          avgDuration: '50.0',
          errorRate: null,
        },
      ]);

      const result = await repository.getEndpointStats(10);

      expect(result[0].errorRate).toBe(0);
    });

    it('should parse valid endpoint stats correctly', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([
        {
          path: '/api/users',
          method: 'GET',
          count: '50',
          avgDuration: '25.5',
          errorRate: '2.0',
        },
      ]);

      const result = await repository.getEndpointStats(10);

      expect(result[0]).toEqual({
        path: '/api/users',
        method: 'GET',
        count: 50,
        avgDuration: 25.5,
        errorRate: 2.0,
      });
    });
  });
});
