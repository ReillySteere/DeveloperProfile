import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';
import * as fs from 'fs';
import * as path from 'path';
import type {
  ITraceRepository,
  TraceFilters,
  TraceStatsResult,
  IRequestTrace,
  CreateTraceInput,
  ITraceService,
} from './trace.types';
import TOKENS from './tokens';

// Re-export types for backward compatibility
export type { CreateTraceInput, ITraceService } from './trace.types';

/** Default trace retention period: 24 hours */
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/** Database size threshold for Sentry alert (30%) */
const DB_SIZE_ALERT_THRESHOLD = 0.3;

/** Maximum expected database size in bytes (default 100MB for Heroku ephemeral) */
const MAX_DB_SIZE_BYTES =
  parseInt(process.env.MAX_DB_SIZE_MB ?? '100', 10) * 1024 * 1024;

@Injectable()
export class TraceService implements ITraceService {
  readonly #repository: ITraceRepository;
  readonly #eventEmitter: EventEmitter2;
  readonly #ttlMs: number;

  constructor(
    @Inject(TOKENS.ITraceRepository)
    repository: ITraceRepository,
    eventEmitter: EventEmitter2,
  ) {
    this.#repository = repository;
    this.#eventEmitter = eventEmitter;
    this.#ttlMs = parseInt(
      process.env.TRACE_TTL_MS ?? String(DEFAULT_TTL_MS),
      10,
    );
  }

  /**
   * Records a new trace and emits an event for SSE subscribers.
   */
  async recordTrace(input: CreateTraceInput): Promise<IRequestTrace> {
    const trace = await this.#repository.create(input);

    // Emit event for real-time streaming
    this.#eventEmitter.emit('trace.created', trace);

    return trace;
  }

  /**
   * Retrieves recent traces with optional filtering.
   */
  async getRecentTraces(filters?: TraceFilters): Promise<IRequestTrace[]> {
    return this.#repository.findRecent(filters);
  }

  /**
   * Retrieves a single trace by ID.
   */
  async getTraceById(traceId: string): Promise<IRequestTrace | null> {
    return this.#repository.findById(traceId);
  }

  /**
   * Gets the total number of traces stored.
   */
  async getTraceCount(): Promise<number> {
    return this.#repository.count();
  }

  /**
   * Cleanup job: removes traces older than TTL.
   * Runs hourly.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldTraces(): Promise<number> {
    const cutoffDate = new Date(Date.now() - this.#ttlMs);
    const deletedCount = await this.#repository.deleteOlderThan(cutoffDate);

    if (deletedCount > 0) {
      console.log(
        `[TraceService] Cleaned up ${deletedCount} traces older than ${cutoffDate.toISOString()}`,
      );
    }

    return deletedCount;
  }

  /**
   * Database size monitor: alerts via Sentry if size exceeds threshold.
   * Runs every 15 minutes.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkDatabaseSize(): Promise<void> {
    try {
      const dbPath = path.resolve(process.cwd(), 'data/database.sqlite');

      if (!fs.existsSync(dbPath)) {
        return;
      }

      const stats = fs.statSync(dbPath);
      const sizeBytes = stats.size;
      const usageRatio = sizeBytes / MAX_DB_SIZE_BYTES;

      if (usageRatio >= DB_SIZE_ALERT_THRESHOLD) {
        const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
        const maxMB = (MAX_DB_SIZE_BYTES / (1024 * 1024)).toFixed(0);
        const percentUsed = (usageRatio * 100).toFixed(1);

        Sentry.captureMessage(
          `Database size alert: ${sizeMB}MB / ${maxMB}MB (${percentUsed}% of capacity)`,
          {
            level: 'warning',
            tags: {
              component: 'TraceService',
              alert: 'database-capacity',
            },
            extra: {
              sizeBytes,
              maxBytes: MAX_DB_SIZE_BYTES,
              usageRatio,
              traceCount: await this.getTraceCount(),
            },
          },
        );

        console.warn(
          `[TraceService] Database size warning: ${percentUsed}% capacity used`,
        );
      }
    } catch (error) {
      // Don't fail the health check if we can't read the DB size
      console.error('[TraceService] Failed to check database size:', error);
    }
  }

  async getStats(): Promise<TraceStatsResult> {
    return this.#repository.getStats();
  }
}
