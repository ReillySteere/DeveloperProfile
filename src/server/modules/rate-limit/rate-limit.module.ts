import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { RateLimitEntry } from './rate-limit.entity';
import { RateLimitRepository } from './rate-limit.repository';
import { RateLimitService } from './rate-limit.service';
import { RateLimiterGuard } from './rate-limiter.guard';
import TOKENS from './tokens';

/**
 * Module providing rate limiting functionality.
 *
 * Features:
 * - Per-endpoint and per-user rate limiting
 * - Configurable rules with glob pattern matching
 * - SQLite persistence for rate limit counters
 * - Scheduled cleanup of expired entries
 * - Standard rate limit headers on responses
 *
 * @see ADR-013: Rate Limiting and Advanced Visualization
 * @see architecture/features/phase-2-observability/rate-limiting.md
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([RateLimitEntry]), ScheduleModule],
  providers: [
    {
      provide: TOKENS.IRateLimitRepository,
      useClass: RateLimitRepository,
    },
    {
      provide: TOKENS.IRateLimitService,
      useClass: RateLimitService,
    },
    RateLimiterGuard,
  ],
  exports: [TOKENS.IRateLimitService, RateLimiterGuard],
})
export class RateLimitModule {}
