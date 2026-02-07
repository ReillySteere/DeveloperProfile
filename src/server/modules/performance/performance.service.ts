import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { IPerformanceRepository } from './performance.repository';
import type {
  PerformanceReportInput,
  AggregatedMetrics,
  Benchmark,
  BundleAnalysis,
} from 'shared/types';
import type { PerformanceReport, BundleSnapshot } from './performance.entity';
import TOKENS from './tokens';
import { PERFORMANCE_EVENTS } from './events';

/** Default retention: 7 days for detailed reports */
const DEFAULT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export interface IPerformanceService {
  reportMetrics(input: PerformanceReportInput): Promise<PerformanceReport>;
  getAggregatedMetrics(
    pageUrl?: string,
    days?: number,
  ): Promise<AggregatedMetrics>;
  getBenchmarks(): Benchmark[];
  getLatestBundle(): Promise<BundleSnapshot | null>;
  saveBundleSnapshot(data: BundleAnalysis): Promise<BundleSnapshot>;
}

@Injectable()
export class PerformanceService implements IPerformanceService {
  readonly #repository: IPerformanceRepository;
  readonly #eventEmitter: EventEmitter2;
  readonly #retentionMs: number;

  constructor(
    @Inject(TOKENS.IPerformanceRepository)
    repository: IPerformanceRepository,
    eventEmitter: EventEmitter2,
  ) {
    this.#repository = repository;
    this.#eventEmitter = eventEmitter;
    this.#retentionMs = parseInt(
      process.env.PERF_RETENTION_MS ?? String(DEFAULT_RETENTION_MS),
      10,
    );
  }

  async reportMetrics(
    input: PerformanceReportInput,
  ): Promise<PerformanceReport> {
    const report = await this.#repository.createReport({
      sessionId: input.sessionId,
      pageUrl: input.pageUrl,
      userAgent: input.userAgent,
      connectionType: input.connectionType ?? null,
      deviceMemory: input.deviceMemory ?? null,
      webVitals: input.webVitals,
      navigationTiming: input.navigationTiming ?? null,
    } as Partial<PerformanceReport>);

    this.#eventEmitter.emit(PERFORMANCE_EVENTS.PERFORMANCE_REPORTED, report);
    return report;
  }

  async getAggregatedMetrics(
    pageUrl?: string,
    days?: number,
  ): Promise<AggregatedMetrics> {
    return this.#repository.getAggregatedMetrics(pageUrl, days);
  }

  getBenchmarks(): Benchmark[] {
    return INDUSTRY_BENCHMARKS;
  }

  async getLatestBundle(): Promise<BundleSnapshot | null> {
    return this.#repository.getLatestBundleSnapshot();
  }

  async saveBundleSnapshot(data: BundleAnalysis): Promise<BundleSnapshot> {
    return this.#repository.saveBundleSnapshot({
      buildId: `build-${Date.now()}`,
      totalSize: data.totalSize,
      gzippedSize: data.gzippedSize,
      modules: data.modules,
    });
  }

  /**
   * Cleanup job: removes performance reports older than retention period.
   * Runs daily at midnight.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldReports(): Promise<number> {
    const cutoffDate = new Date(Date.now() - this.#retentionMs);
    return this.#repository.deleteOlderThan(cutoffDate);
  }
}

/** Industry benchmark data based on Chrome UX Report / HTTP Archive */
const INDUSTRY_BENCHMARKS: Benchmark[] = [
  {
    metric: 'lcp',
    p50: 2100,
    p75: 2500,
    p90: 4200,
    source: 'Chrome UX Report',
    industry: 'Portfolio',
    lastUpdated: '2025-01-01',
  },
  {
    metric: 'fcp',
    p50: 1400,
    p75: 1800,
    p90: 3200,
    source: 'Chrome UX Report',
    industry: 'Portfolio',
    lastUpdated: '2025-01-01',
  },
  {
    metric: 'cls',
    p50: 0.04,
    p75: 0.1,
    p90: 0.25,
    source: 'Chrome UX Report',
    industry: 'Portfolio',
    lastUpdated: '2025-01-01',
  },
  {
    metric: 'inp',
    p50: 150,
    p75: 200,
    p90: 400,
    source: 'Chrome UX Report',
    industry: 'Portfolio',
    lastUpdated: '2025-01-01',
  },
  {
    metric: 'ttfb',
    p50: 500,
    p75: 800,
    p90: 1500,
    source: 'Chrome UX Report',
    industry: 'Portfolio',
    lastUpdated: '2025-01-01',
  },
];
