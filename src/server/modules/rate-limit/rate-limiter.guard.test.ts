import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RateLimiterGuard } from './rate-limiter.guard';
import type {
  IRateLimitService,
  RateLimitCheckResult,
} from './rate-limit.types';

/**
 * Unit tests for RateLimiterGuard.
 * Uses manual dependency injection per project conventions.
 */
describe('RateLimiterGuard (unit)', () => {
  let guard: RateLimiterGuard;
  let mockRateLimitService: jest.Mocked<IRateLimitService>;
  let mockRequest: {
    path: string;
    method: string;
    ip: string;
    user?: { userId: number };
    headers: Record<string, string | string[] | undefined>;
    connection?: { remoteAddress?: string };
  };
  let mockResponse: {
    setHeader: jest.Mock;
  };

  const createMockContext = (): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;
  };

  const allowedResult: RateLimitCheckResult = {
    allowed: true,
    remaining: 99,
    limit: 100,
    resetAt: Date.now() + 60000,
    rule: {
      path: '/api/**',
      windowMs: 60000,
      maxRequests: 100,
      keyStrategy: 'ip',
    },
  };

  const deniedResult: RateLimitCheckResult = {
    allowed: false,
    remaining: 0,
    limit: 5,
    resetAt: Date.now() + 30000,
    rule: {
      path: '/api/auth/login',
      windowMs: 60000,
      maxRequests: 5,
      keyStrategy: 'ip',
    },
  };

  const noRuleResult: RateLimitCheckResult = {
    allowed: true,
    remaining: Infinity,
    limit: Infinity,
    resetAt: 0,
    rule: null,
  };

  beforeEach(() => {
    mockRateLimitService = {
      checkLimit: jest.fn(),
      getRules: jest.fn(),
      setRules: jest.fn(),
    };

    mockRequest = {
      path: '/api/test',
      method: 'GET',
      ip: '192.168.1.1',
      headers: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    guard = new RateLimiterGuard(mockRateLimitService);
  });

  describe('canActivate', () => {
    it('should allow requests within rate limit', async () => {
      mockRateLimitService.checkLimit.mockResolvedValue(allowedResult);

      const result = await guard.canActivate(createMockContext());

      expect(result).toBe(true);
      expect(mockRateLimitService.checkLimit).toHaveBeenCalledWith(
        '192.168.1.1',
        undefined,
        '/api/test',
        'GET',
      );
    });

    it('should set rate limit headers when rule matches', async () => {
      mockRateLimitService.checkLimit.mockResolvedValue(allowedResult);

      await guard.canActivate(createMockContext());

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        '100',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        '99',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(String),
      );
    });

    it('should not set rate limit headers when no rule matches', async () => {
      mockRateLimitService.checkLimit.mockResolvedValue(noRuleResult);

      await guard.canActivate(createMockContext());

      expect(mockResponse.setHeader).not.toHaveBeenCalled();
    });

    it('should throw HttpException with 429 when rate limited', async () => {
      mockRateLimitService.checkLimit.mockResolvedValue(deniedResult);

      await expect(guard.canActivate(createMockContext())).rejects.toThrow(
        HttpException,
      );

      try {
        await guard.canActivate(createMockContext());
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    });

    it('should set Retry-After header when rate limited', async () => {
      mockRateLimitService.checkLimit.mockResolvedValue(deniedResult);

      try {
        await guard.canActivate(createMockContext());
      } catch {
        // Expected to throw
      }

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Retry-After',
        expect.any(String),
      );
    });

    it('should pass userId for authenticated requests', async () => {
      mockRequest.user = { userId: 123 };
      mockRateLimitService.checkLimit.mockResolvedValue(allowedResult);

      await guard.canActivate(createMockContext());

      expect(mockRateLimitService.checkLimit).toHaveBeenCalledWith(
        '192.168.1.1',
        123,
        '/api/test',
        'GET',
      );
    });

    it('should extract IP from X-Forwarded-For header', async () => {
      mockRequest.headers['x-forwarded-for'] = '10.0.0.1, 192.168.1.1';
      mockRateLimitService.checkLimit.mockResolvedValue(allowedResult);

      await guard.canActivate(createMockContext());

      expect(mockRateLimitService.checkLimit).toHaveBeenCalledWith(
        '10.0.0.1',
        undefined,
        '/api/test',
        'GET',
      );
    });

    it('should handle X-Forwarded-For as array', async () => {
      mockRequest.headers['x-forwarded-for'] = ['10.0.0.2', '192.168.1.1'];
      mockRateLimitService.checkLimit.mockResolvedValue(allowedResult);

      await guard.canActivate(createMockContext());

      expect(mockRateLimitService.checkLimit).toHaveBeenCalledWith(
        '10.0.0.2',
        undefined,
        '/api/test',
        'GET',
      );
    });

    it('should fall back to connection.remoteAddress when ip is undefined', async () => {
      mockRequest.ip = undefined as unknown as string;
      mockRequest.connection = { remoteAddress: '172.16.0.1' };
      mockRateLimitService.checkLimit.mockResolvedValue(allowedResult);

      await guard.canActivate(createMockContext());

      expect(mockRateLimitService.checkLimit).toHaveBeenCalledWith(
        '172.16.0.1',
        undefined,
        '/api/test',
        'GET',
      );
    });

    it('should use "unknown" when no IP is available', async () => {
      mockRequest.ip = undefined as unknown as string;
      mockRequest.connection = undefined;
      mockRateLimitService.checkLimit.mockResolvedValue(allowedResult);

      await guard.canActivate(createMockContext());

      expect(mockRateLimitService.checkLimit).toHaveBeenCalledWith(
        'unknown',
        undefined,
        '/api/test',
        'GET',
      );
    });
  });
});
