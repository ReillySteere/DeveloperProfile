import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { RateLimitRule } from 'shared/types';
import type {
  IRateLimitService,
  IRateLimitRepository,
  RateLimitCheckResult,
} from './rate-limit.types';
import {
  DEFAULT_RATE_LIMIT_RULES,
  findMatchingRule,
  isExcludedPath,
  generateKey,
} from './rate-limit.config';
import TOKENS from './tokens';

/**
 * Service for rate limiting logic.
 * Uses a sliding window algorithm with SQLite persistence.
 *
 * @see ADR-013: Rate Limiting and Advanced Visualization
 */
@Injectable()
export class RateLimitService implements IRateLimitService {
  readonly #logger = new Logger(RateLimitService.name);
  #rules: RateLimitRule[];
  readonly #repository: IRateLimitRepository;

  constructor(
    @Inject(TOKENS.IRateLimitRepository)
    repository: IRateLimitRepository,
  ) {
    this.#repository = repository;
    this.#rules = [...DEFAULT_RATE_LIMIT_RULES];
  }

  /**
   * Check if a request should be rate limited.
   * @param ip - Client IP address
   * @param userId - User ID if authenticated
   * @param path - Request path
   * @param _method - HTTP method (reserved for future method-specific rules)
   */
  async checkLimit(
    ip: string,
    userId: number | undefined,
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _method: string,
  ): Promise<RateLimitCheckResult> {
    // Check if path is excluded
    if (isExcludedPath(path)) {
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity,
        resetAt: 0,
        rule: null,
      };
    }

    // Find matching rule
    const rule = findMatchingRule(this.#rules, path);

    if (!rule) {
      // No rule matches - allow by default
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity,
        resetAt: 0,
        rule: null,
      };
    }

    // Generate rate limit key
    const key = generateKey(rule.keyStrategy, ip, userId, rule.path);
    const now = Date.now();

    // Check/increment in repository
    const { count, windowStart } = await this.#repository.incrementOrCreate(
      key,
      rule.windowMs,
      now,
    );

    const remaining = Math.max(0, rule.maxRequests - count);
    const resetAt = windowStart + rule.windowMs;
    const allowed = count <= rule.maxRequests;

    if (!allowed) {
      this.#logger.warn(
        `Rate limit exceeded: key=${key}, count=${count}, limit=${rule.maxRequests}`,
      );
    }

    return {
      allowed,
      remaining,
      limit: rule.maxRequests,
      resetAt,
      rule,
    };
  }

  /**
   * Get the current rules configuration.
   */
  getRules(): RateLimitRule[] {
    return [...this.#rules];
  }

  /**
   * Update the rules configuration.
   */
  setRules(rules: RateLimitRule[]): void {
    this.#rules = [...rules];
    this.#logger.log(`Rate limit rules updated: ${rules.length} rules`);
  }

  /**
   * Cleanup expired rate limit entries.
   * Runs every hour.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredEntries(): Promise<number> {
    const now = Date.now();
    const deleted = await this.#repository.cleanupExpired(now);

    if (deleted > 0) {
      this.#logger.log(`Cleaned up ${deleted} expired rate limit entries`);
    }

    return deleted;
  }
}
