/**
 * Unit tests for PerformanceRepository.
 *
 * These tests cover edge cases that are difficult to test in integration tests,
 * particularly TypeORM's DeleteResult.affected being undefined.
 */
import { PerformanceRepository } from './performance.repository';
import { PerformanceReport, BundleSnapshot } from './performance.entity';
import { Repository, DeleteResult } from 'typeorm';

describe('PerformanceRepository unit tests', () => {
  describe('deleteOlderThan', () => {
    it('returns 0 when affected is undefined', async () => {
      // Create mock repositories
      const mockReportRepo = {
        delete: jest.fn().mockResolvedValue({
          raw: {},
          affected: undefined, // Simulate TypeORM edge case
        } as DeleteResult),
      } as unknown as Repository<PerformanceReport>;

      const mockBundleRepo = {} as unknown as Repository<BundleSnapshot>;

      // Create repository with mocked dependencies
      const repository = new PerformanceRepository(
        mockReportRepo,
        mockBundleRepo,
      );

      const result = await repository.deleteOlderThan(new Date());

      expect(result).toBe(0);
      expect(mockReportRepo.delete).toHaveBeenCalled();
    });

    it('returns affected count when defined', async () => {
      const mockReportRepo = {
        delete: jest.fn().mockResolvedValue({
          raw: {},
          affected: 5,
        } as DeleteResult),
      } as unknown as Repository<PerformanceReport>;

      const mockBundleRepo = {} as unknown as Repository<BundleSnapshot>;

      const repository = new PerformanceRepository(
        mockReportRepo,
        mockBundleRepo,
      );

      const result = await repository.deleteOlderThan(new Date());

      expect(result).toBe(5);
    });
  });
});
