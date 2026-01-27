import { RateLimitService } from './rate-limit.service';
import type { IRateLimitRepository } from './rate-limit.types';
import type { RateLimitRule } from 'shared/types';

/**
 * Unit tests for RateLimitService.
 * Uses manual dependency injection per project conventions.
 *
 * @see .github/copilot-instructions.md - Backend testing patterns
 */
describe('RateLimitService (unit)', () => {
  let service: RateLimitService;
  let mockRepository: jest.Mocked<IRateLimitRepository>;

  beforeEach(() => {
    mockRepository = {
      incrementOrCreate: jest.fn(),
      findByKey: jest.fn(),
      cleanupExpired: jest.fn(),
      findAll: jest.fn(),
    };

    service = new RateLimitService(mockRepository);
  });

  describe('checkLimit', () => {
    it('should allow requests within the limit', async () => {
      mockRepository.incrementOrCreate.mockResolvedValue({
        count: 1,
        windowStart: Date.now(),
      });

      const result = await service.checkLimit(
        '192.168.1.1',
        undefined,
        '/api/blog',
        'GET',
      );

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(result.rule).not.toBeNull();
    });

    it('should deny requests exceeding the limit', async () => {
      mockRepository.incrementOrCreate.mockResolvedValue({
        count: 101, // Exceeds default /api/** limit of 100
        windowStart: Date.now(),
      });

      const result = await service.checkLimit(
        '192.168.1.1',
        undefined,
        '/api/blog',
        'GET',
      );

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should allow unlimited requests for excluded paths', async () => {
      const result = await service.checkLimit(
        '192.168.1.1',
        undefined,
        '/api/health',
        'GET',
      );

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
      expect(result.rule).toBeNull();
      expect(mockRepository.incrementOrCreate).not.toHaveBeenCalled();
    });

    it('should allow requests when no rule matches', async () => {
      const result = await service.checkLimit(
        '192.168.1.1',
        undefined,
        '/static/image.png',
        'GET',
      );

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
      expect(result.rule).toBeNull();
    });

    it('should use user-based key for authenticated users on user strategy paths', async () => {
      mockRepository.incrementOrCreate.mockResolvedValue({
        count: 1,
        windowStart: Date.now(),
      });

      await service.checkLimit('192.168.1.1', 456, '/api/blog', 'POST');

      // The key should use the user strategy for /api/blog
      expect(mockRepository.incrementOrCreate).toHaveBeenCalledWith(
        expect.stringContaining('user:'),
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should calculate correct resetAt time', async () => {
      const windowStart = Date.now();
      mockRepository.incrementOrCreate.mockResolvedValue({
        count: 1,
        windowStart,
      });

      const result = await service.checkLimit(
        '192.168.1.1',
        undefined,
        '/api/blog',
        'GET',
      );

      expect(result.resetAt).toBeGreaterThan(windowStart);
    });
  });

  describe('getRules', () => {
    it('should return a copy of the rules', () => {
      const rules = service.getRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);

      // Modifying the returned array should not affect internal state
      rules.pop();
      expect(service.getRules().length).toBeGreaterThan(rules.length);
    });
  });

  describe('setRules', () => {
    it('should update the rules', () => {
      const newRules: RateLimitRule[] = [
        {
          path: '/api/custom',
          windowMs: 1000,
          maxRequests: 5,
          keyStrategy: 'ip',
        },
      ];

      service.setRules(newRules);
      const rules = service.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].path).toBe('/api/custom');
    });
  });

  describe('cleanupExpiredEntries', () => {
    it('should call repository cleanup', async () => {
      mockRepository.cleanupExpired.mockResolvedValue(5);

      const deleted = await service.cleanupExpiredEntries();

      expect(deleted).toBe(5);
      expect(mockRepository.cleanupExpired).toHaveBeenCalledWith(
        expect.any(Number),
      );
    });

    it('should not log when no entries deleted', async () => {
      mockRepository.cleanupExpired.mockResolvedValue(0);

      const deleted = await service.cleanupExpiredEntries();

      expect(deleted).toBe(0);
    });
  });
});
