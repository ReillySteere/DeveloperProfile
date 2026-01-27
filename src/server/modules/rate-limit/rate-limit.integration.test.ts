import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { RateLimitModule } from './rate-limit.module';
import { RateLimitEntry } from './rate-limit.entity';
import { RateLimiterGuard } from './rate-limiter.guard';
import type {
  IRateLimitService,
  IRateLimitRepository,
} from './rate-limit.types';
import TOKENS from './tokens';

describe('RateLimit Integration', () => {
  let module: TestingModule;
  let service: IRateLimitService;
  let guard: RateLimiterGuard;
  let repository: IRateLimitRepository;
  let typeormRepo: Repository<RateLimitEntry>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [RateLimitEntry],
          synchronize: true,
        }),
        ScheduleModule.forRoot(),
        RateLimitModule,
      ],
    }).compile();

    service = module.get<IRateLimitService>(TOKENS.IRateLimitService);
    guard = module.get<RateLimiterGuard>(RateLimiterGuard);
    repository = module.get<IRateLimitRepository>(TOKENS.IRateLimitRepository);
    typeormRepo = module.get<Repository<RateLimitEntry>>(
      getRepositoryToken(RateLimitEntry),
    );
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clear all entries between tests
    await typeormRepo.clear();
  });

  describe('RateLimitService', () => {
    it('should allow first request within limit', async () => {
      const result = await service.checkLimit(
        '10.0.0.1',
        undefined,
        '/api/test',
        'GET',
      );

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('should track request count across multiple calls', async () => {
      const ip = '10.0.0.2';
      const path = '/api/tracked';

      const first = await service.checkLimit(ip, undefined, path, 'GET');
      const second = await service.checkLimit(ip, undefined, path, 'GET');
      const third = await service.checkLimit(ip, undefined, path, 'GET');

      expect(first.remaining).toBeGreaterThan(second.remaining);
      expect(second.remaining).toBeGreaterThan(third.remaining);
    });

    it('should enforce auth endpoint limits', async () => {
      const ip = '10.0.0.3';

      // Login endpoint has strict limit (5/min)
      for (let i = 0; i < 5; i++) {
        const result = await service.checkLimit(
          ip,
          undefined,
          '/api/auth/login',
          'POST',
        );
        expect(result.allowed).toBe(true);
      }

      // 6th request should be denied
      const denied = await service.checkLimit(
        ip,
        undefined,
        '/api/auth/login',
        'POST',
      );
      expect(denied.allowed).toBe(false);
      expect(denied.remaining).toBe(0);
    });

    it('should not rate limit excluded paths', async () => {
      const result = await service.checkLimit(
        '10.0.0.4',
        undefined,
        '/api/health',
        'GET',
      );

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
      expect(result.rule).toBeNull();
    });

    it('should use separate limits for different IPs', async () => {
      // First IP
      for (let i = 0; i < 5; i++) {
        await service.checkLimit(
          '10.0.0.10',
          undefined,
          '/api/auth/login',
          'POST',
        );
      }
      const denied1 = await service.checkLimit(
        '10.0.0.10',
        undefined,
        '/api/auth/login',
        'POST',
      );
      expect(denied1.allowed).toBe(false);

      // Second IP should still be allowed
      const allowed2 = await service.checkLimit(
        '10.0.0.11',
        undefined,
        '/api/auth/login',
        'POST',
      );
      expect(allowed2.allowed).toBe(true);
    });

    it('should return rules list', () => {
      const rules = service.getRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should allow updating rules', () => {
      const originalRules = service.getRules();
      const newRules = [
        {
          path: '/api/custom',
          windowMs: 1000,
          maxRequests: 1,
          keyStrategy: 'ip' as const,
        },
      ];

      service.setRules(newRules);
      expect(service.getRules()).toEqual(newRules);

      // Restore original rules
      service.setRules(originalRules);
    });
  });

  describe('RateLimiterGuard', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should implement CanActivate', () => {
      expect(typeof guard.canActivate).toBe('function');
    });
  });

  describe('RateLimitRepository', () => {
    it('should find entry by key', async () => {
      // Create an entry first via service
      await service.checkLimit(
        '192.168.1.100',
        undefined,
        '/api/test-find',
        'GET',
      );

      const entry = await repository.findByKey('ip:192.168.1.100:/api/**');
      expect(entry).not.toBeNull();
      expect(entry?.count).toBe(1);
    });

    it('should return null for non-existent key', async () => {
      const entry = await repository.findByKey('nonexistent-key');
      expect(entry).toBeNull();
    });

    it('should reset window when expired', async () => {
      const now = Date.now();
      const key = 'test-window-reset';
      const windowMs = 100; // 100ms window

      // First request
      const first = await repository.incrementOrCreate(key, windowMs, now);
      expect(first.count).toBe(1);

      // Second request within window
      const second = await repository.incrementOrCreate(
        key,
        windowMs,
        now + 50,
      );
      expect(second.count).toBe(2);

      // Third request after window expired
      const third = await repository.incrementOrCreate(
        key,
        windowMs,
        now + 200,
      );
      expect(third.count).toBe(1); // Reset
    });

    it('should list all entries', async () => {
      // Create some entries
      await service.checkLimit(
        '192.168.2.1',
        undefined,
        '/api/list-test',
        'GET',
      );
      await service.checkLimit(
        '192.168.2.2',
        undefined,
        '/api/list-test',
        'GET',
      );

      const entries = await repository.findAll();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThanOrEqual(2);
    });

    it('should cleanup expired entries', async () => {
      const now = Date.now();
      const key = 'test-cleanup-entry';
      const windowMs = 100;

      // Create an entry that will expire quickly
      await repository.incrementOrCreate(key, windowMs, now - 300);

      // Cleanup
      const deleted = await repository.cleanupExpired(now);
      expect(deleted).toBeGreaterThanOrEqual(1);

      // Entry should be gone
      const entry = await repository.findByKey(key);
      expect(entry).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup expired entries', async () => {
      // Access the service's cleanup method
      const rateLimitService = service as unknown as {
        cleanupExpiredEntries: () => Promise<number>;
      };

      const deleted = await rateLimitService.cleanupExpiredEntries();
      expect(typeof deleted).toBe('number');
    });
  });
});
