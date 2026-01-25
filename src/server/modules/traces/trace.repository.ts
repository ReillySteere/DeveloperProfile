import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RequestTrace } from './trace.entity';
import type {
  ITraceRepository,
  TraceFilters,
  TraceStatsResult,
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
    /* istanbul ignore next -- defensive coding, TypeORM always returns affected */
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

    /* istanbul ignore next -- defensive coding, getRawOne always returns an object */
    return {
      totalCount: parseInt(result?.totalCount ?? '0', 10),
      avgDuration: parseFloat(result?.avgDuration ?? '0'),
      errorRate: parseFloat(result?.errorRate ?? '0'),
    };
  }
}
