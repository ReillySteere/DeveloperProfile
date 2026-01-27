import {
  matchPath,
  findMatchingRule,
  isExcludedPath,
  generateKey,
  isE2EBypassEnabled,
  E2E_BYPASS_HEADER,
  DEFAULT_RATE_LIMIT_RULES,
  RATE_LIMIT_EXCLUDED_PATHS,
} from './rate-limit.config';
import type { RateLimitRule } from 'shared/types';

describe('rate-limit.config', () => {
  describe('matchPath', () => {
    it('should match exact paths', () => {
      expect(matchPath('/api/blog', '/api/blog')).toBe(true);
      expect(matchPath('/api/blog', '/api/blog/123')).toBe(false);
    });

    it('should match single wildcard patterns', () => {
      expect(matchPath('/api/blog/*', '/api/blog/123')).toBe(true);
      expect(matchPath('/api/blog/*', '/api/blog')).toBe(false);
      expect(matchPath('/api/blog/*', '/api/blog/123/comments')).toBe(false);
    });

    it('should match double wildcard patterns', () => {
      expect(matchPath('/api/**', '/api/blog')).toBe(true);
      expect(matchPath('/api/**', '/api/blog/123')).toBe(true);
      expect(matchPath('/api/**', '/api/blog/123/comments')).toBe(true);
      expect(matchPath('/api/**', '/api')).toBe(true);
      expect(matchPath('/api/**', '/other')).toBe(false);
    });

    it('should not match unrelated paths', () => {
      expect(matchPath('/api/blog', '/api/experience')).toBe(false);
      expect(matchPath('/api/blog/*', '/api/experience/123')).toBe(false);
    });
  });

  describe('findMatchingRule', () => {
    const rules: RateLimitRule[] = [
      {
        path: '/api/auth/login',
        windowMs: 60000,
        maxRequests: 5,
        keyStrategy: 'ip',
      },
      {
        path: '/api/blog',
        windowMs: 60000,
        maxRequests: 10,
        keyStrategy: 'user',
      },
      { path: '/api/**', windowMs: 60000, maxRequests: 100, keyStrategy: 'ip' },
    ];

    it('should return the first matching rule', () => {
      const rule = findMatchingRule(rules, '/api/auth/login');
      expect(rule).not.toBeNull();
      expect(rule?.path).toBe('/api/auth/login');
      expect(rule?.maxRequests).toBe(5);
    });

    it('should match exact paths before wildcards', () => {
      const rule = findMatchingRule(rules, '/api/blog');
      expect(rule).not.toBeNull();
      expect(rule?.path).toBe('/api/blog');
      expect(rule?.maxRequests).toBe(10);
    });

    it('should fall back to wildcard rules', () => {
      const rule = findMatchingRule(rules, '/api/experience');
      expect(rule).not.toBeNull();
      expect(rule?.path).toBe('/api/**');
      expect(rule?.maxRequests).toBe(100);
    });

    it('should return null for non-matching paths', () => {
      const rule = findMatchingRule(rules, '/health');
      expect(rule).toBeNull();
    });
  });

  describe('isExcludedPath', () => {
    it('should exclude health endpoints', () => {
      expect(isExcludedPath('/api/health')).toBe(true);
      expect(isExcludedPath('/api/health/stream')).toBe(true);
    });

    it('should exclude trace stream endpoint', () => {
      expect(isExcludedPath('/api/traces/stream')).toBe(true);
    });

    it('should not exclude regular endpoints', () => {
      expect(isExcludedPath('/api/blog')).toBe(false);
      expect(isExcludedPath('/api/experience')).toBe(false);
    });
  });

  describe('generateKey', () => {
    it('should generate IP-based key', () => {
      const key = generateKey('ip', '192.168.1.1', undefined, '/api/blog');
      expect(key).toBe('ip:192.168.1.1:/api/blog');
    });

    it('should generate user-based key for authenticated users', () => {
      const key = generateKey('user', '192.168.1.1', 123, '/api/blog');
      expect(key).toBe('user:123:/api/blog');
    });

    it('should fall back to IP for user strategy with unauthenticated users', () => {
      const key = generateKey('user', '192.168.1.1', undefined, '/api/blog');
      expect(key).toBe('ip:192.168.1.1:/api/blog');
    });

    it('should generate combined key for ip+user strategy', () => {
      const key = generateKey('ip+user', '192.168.1.1', 123, '/api/blog');
      expect(key).toBe('ip+user:192.168.1.1:123:/api/blog');
    });

    it('should fall back to IP for ip+user strategy with unauthenticated users', () => {
      const key = generateKey('ip+user', '192.168.1.1', undefined, '/api/blog');
      expect(key).toBe('ip:192.168.1.1:/api/blog');
    });
  });

  describe('DEFAULT_RATE_LIMIT_RULES', () => {
    it('should have stricter limits for auth endpoints', () => {
      const loginRule = DEFAULT_RATE_LIMIT_RULES.find(
        (r) => r.path === '/api/auth/login',
      );
      expect(loginRule).toBeDefined();
      expect(loginRule?.maxRequests).toBeLessThanOrEqual(10);
    });

    it('should have a fallback API rule', () => {
      const fallbackRule = DEFAULT_RATE_LIMIT_RULES.find(
        (r) => r.path === '/api/**',
      );
      expect(fallbackRule).toBeDefined();
    });
  });

  describe('RATE_LIMIT_EXCLUDED_PATHS', () => {
    it('should include health and streaming endpoints', () => {
      expect(RATE_LIMIT_EXCLUDED_PATHS).toContain('/api/health');
      expect(RATE_LIMIT_EXCLUDED_PATHS).toContain('/api/traces/stream');
    });
  });

  describe('isE2EBypassEnabled', () => {
    const originalEnv = process.env.E2E_RATE_LIMIT_BYPASS;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.E2E_RATE_LIMIT_BYPASS;
      } else {
        process.env.E2E_RATE_LIMIT_BYPASS = originalEnv;
      }
    });

    it('should export E2E_BYPASS_HEADER constant', () => {
      expect(E2E_BYPASS_HEADER).toBe('x-e2e-bypass');
    });

    it('should return true when both env var and header are present', () => {
      process.env.E2E_RATE_LIMIT_BYPASS = 'true';
      const headers = { 'x-e2e-bypass': 'true' };
      expect(isE2EBypassEnabled(headers)).toBe(true);
    });

    it('should return false when env var is not set', () => {
      delete process.env.E2E_RATE_LIMIT_BYPASS;
      const headers = { 'x-e2e-bypass': 'true' };
      expect(isE2EBypassEnabled(headers)).toBe(false);
    });

    it('should return false when env var is set but header is missing', () => {
      process.env.E2E_RATE_LIMIT_BYPASS = 'true';
      const headers = {};
      expect(isE2EBypassEnabled(headers)).toBe(false);
    });

    it('should return false when env var is set to something other than "true"', () => {
      process.env.E2E_RATE_LIMIT_BYPASS = 'yes';
      const headers = { 'x-e2e-bypass': 'true' };
      expect(isE2EBypassEnabled(headers)).toBe(false);
    });

    it('should work with empty string header value', () => {
      process.env.E2E_RATE_LIMIT_BYPASS = 'true';
      const headers = { 'x-e2e-bypass': '' };
      expect(isE2EBypassEnabled(headers)).toBe(true);
    });
  });
});
