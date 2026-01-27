import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual } from 'typeorm';
import { RequestTrace } from './trace.entity';
import type {
  ITraceRepository,
  TraceFilters,
  TraceStatsResult,
  HourlyStatsResult,
  EndpointStatsResult,
} from './trace.types';

// Re-export types for backward compatibility
export type {
  TraceFilters,
  TraceStatsResult,
  ITraceRepository,
} from './trace.types';

@Injectable()
export class TraceRepository implements ITraceRepository {
  readonly #repo: Repository<RequestTrace>;

  constructor(
    @InjectRepository(RequestTrace)
    repo: Repository<RequestTrace>,
  ) {
    this.#repo = repo;
  }

  async create(trace: Partial<RequestTrace>): Promise<RequestTrace> {
    const newTrace = this.#repo.create(trace);
    return this.#repo.save(newTrace);
  }

  async findRecent(filters: TraceFilters = {}): Promise<RequestTrace[]> {
    const {
      method,
      path,
      statusCode,
      minDuration,
      maxDuration,
      limit = 100,
      offset = 0,
    } = filters;

    const queryBuilder = this.#repo.createQueryBuilder('trace');

    if (method) {
      queryBuilder.andWhere('trace.method = :method', { method });
    }

    if (path) {
      queryBuilder.andWhere('trace.path LIKE :path', { path: `%${path}%` });
    }

    if (statusCode !== undefined) {
      queryBuilder.andWhere('trace.statusCode = :statusCode', { statusCode });
    }

    if (minDuration !== undefined) {
      queryBuilder.andWhere('trace.durationMs >= :minDuration', {
        minDuration,
      });
    }

    if (maxDuration !== undefined) {
      queryBuilder.andWhere('trace.durationMs <= :maxDuration', {
        maxDuration,
      });
    }

    return queryBuilder
      .orderBy('trace.timestamp', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();
  }

  async findById(traceId: string): Promise<RequestTrace | null> {
    return this.#repo.findOne({ where: { traceId } });
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.#repo.delete({
      timestamp: LessThan(date),
    });
    return result.affected ?? 0;
  }

  async count(): Promise<number> {
    return this.#repo.count();
  }

  async getStats(): Promise<TraceStatsResult> {
    const result = await this.#repo
      .createQueryBuilder('trace')
      .select('COUNT(*)', 'totalCount')
      .addSelect('AVG(trace.durationMs)', 'avgDuration')
      .addSelect(
        'CAST(SUM(CASE WHEN trace.statusCode >= 400 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / NULLIF(COUNT(*), 0)',
        'errorRate',
      )
      .getRawOne<{
        totalCount: string;
        avgDuration: string;
        errorRate: string;
      }>();

    return {
      totalCount: parseInt(result?.totalCount ?? '0', 10),
      avgDuration: parseFloat(result?.avgDuration ?? '0'),
      errorRate: parseFloat(result?.errorRate ?? '0'),
    };
  }

  async getHourlyStats(hours: number = 24): Promise<HourlyStatsResult[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get all traces from the time window
    const traces = await this.#repo.find({
      where: { timestamp: MoreThanOrEqual(cutoff) },
      order: { timestamp: 'ASC' },
    });

    // Group by hour
    const hourlyMap = new Map<
      string,
      { durations: number[]; errorCount: number }
    >();

    for (const trace of traces) {
      const date = new Date(trace.timestamp);
      date.setMinutes(0, 0, 0);
      const hourKey = date.toISOString();

      if (!hourlyMap.has(hourKey)) {
        hourlyMap.set(hourKey, { durations: [], errorCount: 0 });
      }

      const bucket = hourlyMap.get(hourKey)!;
      bucket.durations.push(trace.durationMs);
      if (trace.statusCode >= 400) {
        bucket.errorCount++;
      }
    }

    // Calculate stats for each hour
    const results: HourlyStatsResult[] = [];
    for (const [hour, bucket] of hourlyMap) {
      const count = bucket.durations.length;
      // count is guaranteed >= 1 since we only add to hourlyMap when processing traces
      const avgDuration = bucket.durations.reduce((a, b) => a + b, 0) / count;
      const errorRate = (bucket.errorCount / count) * 100;

      // Calculate p95
      const sorted = [...bucket.durations].sort((a, b) => a - b);
      const p95Index = Math.ceil(sorted.length * 0.95) - 1;
      // sorted is guaranteed non-empty since count >= 1
      const p95Duration = sorted[Math.max(0, p95Index)];

      results.push({
        hour,
        count,
        avgDuration,
        errorRate,
        p95Duration,
      });
    }

    return results;
  }

  async getEndpointStats(limit: number = 20): Promise<EndpointStatsResult[]> {
    const result = await this.#repo
      .createQueryBuilder('trace')
      .select('trace.path', 'path')
      .addSelect('trace.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(trace.durationMs)', 'avgDuration')
      .addSelect(
        'CAST(SUM(CASE WHEN trace.statusCode >= 400 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / NULLIF(COUNT(*), 0)',
        'errorRate',
      )
      .groupBy('trace.path')
      .addGroupBy('trace.method')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany<{
        path: string;
        method: string;
        count: string;
        avgDuration: string;
        errorRate: string;
      }>();

    return result.map((row) => ({
      path: row.path,
      method: row.method,
      count: parseInt(row.count, 10),
      avgDuration: parseFloat(row.avgDuration),
      errorRate: parseFloat(row.errorRate ?? '0'),
    }));
  }
}
