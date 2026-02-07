import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PerformanceReport } from './performance.entity';
import { BundleSnapshot } from './performance.entity';
import type { AggregatedMetrics } from 'shared/types';

export interface IPerformanceRepository {
  createReport(data: Partial<PerformanceReport>): Promise<PerformanceReport>;
  getAggregatedMetrics(
    pageUrl?: string,
    days?: number,
  ): Promise<AggregatedMetrics>;
  deleteOlderThan(date: Date): Promise<number>;
  saveBundleSnapshot(data: Partial<BundleSnapshot>): Promise<BundleSnapshot>;
  getLatestBundleSnapshot(): Promise<BundleSnapshot | null>;
}

@Injectable()
export class PerformanceRepository implements IPerformanceRepository {
  readonly #reportRepo: Repository<PerformanceReport>;
  readonly #bundleRepo: Repository<BundleSnapshot>;

  constructor(
    @InjectRepository(PerformanceReport)
    reportRepo: Repository<PerformanceReport>,
    @InjectRepository(BundleSnapshot)
    bundleRepo: Repository<BundleSnapshot>,
  ) {
    this.#reportRepo = reportRepo;
    this.#bundleRepo = bundleRepo;
  }

  async createReport(
    data: Partial<PerformanceReport>,
  ): Promise<PerformanceReport> {
    const report = this.#reportRepo.create(data);
    return this.#reportRepo.save(report);
  }

  async getAggregatedMetrics(
    pageUrl?: string,
    days: number = 7,
  ): Promise<AggregatedMetrics> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const queryBuilder = this.#reportRepo
      .createQueryBuilder('report')
      .where('report.timestamp >= :cutoff', { cutoff: cutoff.toISOString() });

    if (pageUrl) {
      queryBuilder.andWhere('report.pageUrl = :pageUrl', { pageUrl });
    }

    const reports = await queryBuilder
      .orderBy('report.timestamp', 'ASC')
      .getMany();

    if (reports.length === 0) {
      return {
        totalReports: 0,
        averageLcp: 0,
        averageFcp: 0,
        averageCls: 0,
        averageTtfb: 0,
        p75Lcp: 0,
        p75Fcp: 0,
        p75Cls: 0,
        p75Ttfb: 0,
      };
    }

    const lcpValues: number[] = [];
    const fcpValues: number[] = [];
    const clsValues: number[] = [];
    const ttfbValues: number[] = [];

    for (const report of reports) {
      if (report.webVitals.lcp) lcpValues.push(report.webVitals.lcp.value);
      if (report.webVitals.fcp) fcpValues.push(report.webVitals.fcp.value);
      if (report.webVitals.cls) clsValues.push(report.webVitals.cls.value);
      if (report.webVitals.ttfb) ttfbValues.push(report.webVitals.ttfb.value);
    }

    return {
      totalReports: reports.length,
      averageLcp: average(lcpValues),
      averageFcp: average(fcpValues),
      averageCls: average(clsValues),
      averageTtfb: average(ttfbValues),
      p75Lcp: percentile(lcpValues, 75),
      p75Fcp: percentile(fcpValues, 75),
      p75Cls: percentile(clsValues, 75),
      p75Ttfb: percentile(ttfbValues, 75),
    };
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.#reportRepo.delete({
      timestamp: LessThan(date),
    });
    return result.affected ?? 0;
  }

  async saveBundleSnapshot(
    data: Partial<BundleSnapshot>,
  ): Promise<BundleSnapshot> {
    const snapshot = this.#bundleRepo.create(data);
    return this.#bundleRepo.save(snapshot);
  }

  async getLatestBundleSnapshot(): Promise<BundleSnapshot | null> {
    return this.#bundleRepo.findOne({
      order: { generatedAt: 'DESC' },
      where: {},
    });
  }
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}
