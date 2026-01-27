/**
 * Rate limiting types shared between frontend and backend.
 * @see ADR-013: Rate Limiting and Advanced Visualization
 */

/**
 * Strategy for generating rate limit keys.
 */
export type RateLimitKeyStrategy = 'ip' | 'user' | 'ip+user';

/**
 * Configuration for a rate limit rule.
 */
export interface RateLimitRule {
  /** Glob pattern for matching paths (e.g., '/api/blog/*') */
  path: string;
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed per window */
  maxRequests: number;
  /** Strategy for generating the rate limit key */
  keyStrategy: RateLimitKeyStrategy;
}

/**
 * Rate limit status returned in API responses.
 */
export interface RateLimitStatus {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Requests remaining in current window */
  remaining: number;
  /** Total requests allowed per window */
  limit: number;
  /** Unix timestamp when the window resets */
  resetAt: number;
}

/**
 * Rate limit headers included in API responses.
 */
export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'Retry-After'?: string; // Only included when rate limited
}
