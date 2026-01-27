import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RateLimitEntry } from './rate-limit.entity';
import type { IRateLimitRepository, IRateLimitEntry } from './rate-limit.types';

/**
 * Repository for rate limit entry persistence.
 * Uses SQLite for storage with TypeORM.
 *
 * @see ADR-013: Rate Limiting and Advanced Visualization
 */
@Injectable()
export class RateLimitRepository implements IRateLimitRepository {
  constructor(
    @InjectRepository(RateLimitEntry)
    private readonly repo: Repository<RateLimitEntry>,
  ) {}

  /**
   * Increment the request count for a key, creating entry if needed.
   * Handles window reset when the previous window has expired.
   */
  async incrementOrCreate(
    key: string,
    windowMs: number,
    now: number,
  ): Promise<{ count: number; windowStart: number }> {
    const existing = await this.repo.findOne({ where: { key } });

    if (existing) {
      // Check if window has expired
      if (now >= existing.windowStart + windowMs) {
        // Reset window
        existing.count = 1;
        existing.windowStart = now;
        existing.expiresAt = now + windowMs * 2; // Keep for 2x window for debugging
        await this.repo.save(existing);
        return { count: 1, windowStart: now };
      }

      // Increment within current window
      existing.count += 1;
      await this.repo.save(existing);
      return { count: existing.count, windowStart: existing.windowStart };
    }

    // Create new entry
    const entry = this.repo.create({
      key,
      count: 1,
      windowStart: now,
      expiresAt: now + windowMs * 2,
    });
    await this.repo.save(entry);
    return { count: 1, windowStart: now };
  }

  /**
   * Get the current entry for a key.
   */
  async findByKey(key: string): Promise<IRateLimitEntry | null> {
    const entry = await this.repo.findOne({ where: { key } });
    if (!entry) return null;

    return {
      key: entry.key,
      count: entry.count,
      windowStart: Number(entry.windowStart),
      expiresAt: Number(entry.expiresAt),
    };
  }

  /**
   * Clean up expired entries.
   */
  async cleanupExpired(now: number): Promise<number> {
    const result = await this.repo.delete({
      expiresAt: LessThan(now),
    });
    /* istanbul ignore next -- affected is always defined with SQLite but null-safe for other DBs */
    return result.affected ?? 0;
  }

  /**
   * Get all entries (for testing/debugging).
   */
  async findAll(): Promise<IRateLimitEntry[]> {
    const entries = await this.repo.find();
    return entries.map((e) => ({
      key: e.key,
      count: e.count,
      windowStart: Number(e.windowStart),
      expiresAt: Number(e.expiresAt),
    }));
  }
}
