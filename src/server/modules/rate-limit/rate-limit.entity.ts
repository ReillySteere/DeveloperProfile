import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import type { IRateLimitEntry } from './rate-limit.types';

/**
 * Rate limit entry entity for tracking request counts.
 *
 * Each entry represents the request count for a specific key
 * (combination of IP/user and path) within a time window.
 *
 * @see ADR-013: Rate Limiting and Advanced Visualization
 */
@Entity('rate_limit_entries')
export class RateLimitEntry implements IRateLimitEntry {
  /**
   * Composite key for rate limiting.
   * Format: "strategy:identifier:path"
   * Examples:
   * - "ip:192.168.1.1:/api/blog"
   * - "user:123:/api/blog"
   * - "ip+user:192.168.1.1:123:/api/blog"
   */
  @PrimaryColumn({ length: 512 })
  key: string;

  /** Number of requests in the current window */
  @Column({ type: 'integer', default: 0 })
  count: number;

  /** Unix timestamp (ms) when the current window started */
  @Column({ type: 'bigint' })
  windowStart: number;

  /** Unix timestamp (ms) when this entry expires (for cleanup) */
  @Index()
  @Column({ type: 'bigint' })
  expiresAt: number;
}
