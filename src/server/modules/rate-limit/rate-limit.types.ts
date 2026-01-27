import type { RateLimitRule, RateLimitKeyStrategy } from 'shared/types';

// Re-export for convenience
export type { RateLimitRule, RateLimitKeyStrategy };

/**
 * Result from checking rate limit.
 */
export interface RateLimitCheckResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Requests remaining in current window */
  remaining: number;
  /** Total requests allowed per window */
  limit: number;
  /** Unix timestamp when the window resets */
  resetAt: number;
  /** The matched rule (if any) */
  rule: RateLimitRule | null;
}

/**
 * Input for recording a rate limit check.
 */
export interface RateLimitInput {
  /** Composite key for rate limiting (e.g., "ip:192.168.1.1:/api/blog") */
  key: string;
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed per window */
  maxRequests: number;
}

/**
 * Rate limit entry from storage.
 */
export interface IRateLimitEntry {
  key: string;
  count: number;
  windowStart: number;
  expiresAt: number;
}

/**
 * Repository interface for rate limit storage.
 */
export interface IRateLimitRepository {
  /**
   * Increment the request count for a key, creating entry if needed.
   * Returns the current count after increment.
   */
  incrementOrCreate(
    key: string,
    windowMs: number,
    now: number,
  ): Promise<{ count: number; windowStart: number }>;

  /**
   * Get the current entry for a key.
   */
  findByKey(key: string): Promise<IRateLimitEntry | null>;

  /**
   * Clean up expired entries.
   * Returns the number of entries deleted.
   */
  cleanupExpired(now: number): Promise<number>;

  /**
   * Get all entries (for testing/debugging).
   */
  findAll(): Promise<IRateLimitEntry[]>;
}

/**
 * Service interface for rate limiting logic.
 */
export interface IRateLimitService {
  /**
   * Check if a request should be rate limited.
   */
  checkLimit(
    ip: string,
    userId: number | undefined,
    path: string,
    method: string,
  ): Promise<RateLimitCheckResult>;

  /**
   * Get the current rules configuration.
   */
  getRules(): RateLimitRule[];

  /**
   * Update the rules configuration (admin only).
   */
  setRules(rules: RateLimitRule[]): void;
}
