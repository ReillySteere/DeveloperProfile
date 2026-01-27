import type { RateLimitRule } from 'shared/types';

/**
 * Default rate limit rules.
 * These can be overridden via admin API.
 *
 * Rules are matched in order - first match wins.
 *
 * @see ADR-013: Rate Limiting and Advanced Visualization
 */
export const DEFAULT_RATE_LIMIT_RULES: RateLimitRule[] = [
  // Strict limit on auth endpoints to prevent brute force
  {
    path: '/api/auth/login',
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyStrategy: 'ip',
  },
  {
    path: '/api/auth/register',
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyStrategy: 'ip',
  },

  // Blog write operations (authenticated users)
  {
    path: '/api/blog',
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyStrategy: 'user',
  },

  // General API fallback - generous for read operations
  {
    path: '/api/**',
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyStrategy: 'ip',
  },
];

/**
 * Paths excluded from rate limiting.
 * These are high-frequency or internal endpoints.
 */
export const RATE_LIMIT_EXCLUDED_PATHS: string[] = [
  '/api/health',
  '/api/health/stream',
  '/api/traces/stream',
];

/**
 * Header for bypassing rate limits in e2e tests.
 * Only works when E2E_RATE_LIMIT_BYPASS=true is set.
 */
export const E2E_BYPASS_HEADER = 'x-e2e-bypass';

/**
 * Check if e2e bypass is enabled for this request.
 * Requires both:
 * - E2E_RATE_LIMIT_BYPASS environment variable set to 'true'
 * - Request includes the x-e2e-bypass header
 */
export function isE2EBypassEnabled(
  headers: Record<string, string | string[] | undefined>,
): boolean {
  const bypassEnabled = process.env.E2E_RATE_LIMIT_BYPASS === 'true';
  const hasHeader = headers[E2E_BYPASS_HEADER] !== undefined;
  return bypassEnabled && hasHeader;
}

/**
 * Check if a path matches a glob pattern.
 * Supports:
 * - Exact match: "/api/blog"
 * - Wildcard suffix: "/api/blog/*" (one level)
 * - Double wildcard: "/api/**" (any depth)
 */
export function matchPath(pattern: string, path: string): boolean {
  // Exact match
  if (pattern === path) {
    return true;
  }

  // Double wildcard - matches any depth
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return path === prefix || path.startsWith(prefix + '/');
  }

  // Single wildcard - matches one path segment
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);
    if (!path.startsWith(prefix + '/')) {
      return false;
    }
    const remainder = path.slice(prefix.length + 1);
    return !remainder.includes('/');
  }

  return false;
}

/**
 * Find the first matching rule for a path.
 */
export function findMatchingRule(
  rules: RateLimitRule[],
  path: string,
): RateLimitRule | null {
  for (const rule of rules) {
    if (matchPath(rule.path, path)) {
      return rule;
    }
  }
  return null;
}

/**
 * Check if a path is excluded from rate limiting.
 */
export function isExcludedPath(path: string): boolean {
  return RATE_LIMIT_EXCLUDED_PATHS.some(
    (excluded) => path === excluded || path.startsWith(excluded),
  );
}

/**
 * Generate a rate limit key based on the strategy.
 */
export function generateKey(
  strategy: RateLimitRule['keyStrategy'],
  ip: string,
  userId: number | undefined,
  path: string,
): string {
  switch (strategy) {
    case 'ip':
      return `ip:${ip}:${path}`;
    case 'user':
      // Fall back to IP for unauthenticated users
      return userId ? `user:${userId}:${path}` : `ip:${ip}:${path}`;
    case 'ip+user':
      return userId ? `ip+user:${ip}:${userId}:${path}` : `ip:${ip}:${path}`;
  }
}
