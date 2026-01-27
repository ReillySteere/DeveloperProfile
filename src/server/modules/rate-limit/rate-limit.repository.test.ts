import { Repository } from 'typeorm';
import { RateLimitRepository } from './rate-limit.repository';
import { RateLimitEntry } from './rate-limit.entity';

/**
 * Unit tests for RateLimitRepository defensive branches.
 * These test edge cases that are difficult to reproduce with integration tests,
 * specifically the nullish coalescing fallback for delete operations.
 */
describe('RateLimitRepository (Unit)', () => {
  let repository: RateLimitRepository;
  let mockRepo: jest.Mocked<Repository<RateLimitEntry>>;

  beforeEach(() => {
    mockRepo = {
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<RateLimitEntry>>;

    repository = new RateLimitRepository(mockRepo);
  });

  describe('cleanupExpired', () => {
    it('should return 0 when affected is undefined', async () => {
      // Covers the ?? 0 branch on line 81
      mockRepo.delete.mockResolvedValue({ affected: undefined, raw: {} });

      const result = await repository.cleanupExpired(Date.now());

      expect(result).toBe(0);
    });

    it('should return 0 when affected is null', async () => {
      // Covers the ?? 0 branch on line 81
      mockRepo.delete.mockResolvedValue({
        affected: null as unknown as number,
        raw: {},
      });

      const result = await repository.cleanupExpired(Date.now());

      expect(result).toBe(0);
    });

    it('should return affected count when defined', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 3, raw: {} });

      const result = await repository.cleanupExpired(Date.now());

      expect(result).toBe(3);
    });
  });
});
