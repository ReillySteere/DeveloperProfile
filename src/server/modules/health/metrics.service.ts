import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { monitorEventLoopDelay, type IntervalHistogram } from 'node:perf_hooks';
import type {
  TelemetrySnapshot,
  ChaosFlags,
  EventLoopMetrics,
} from 'shared/types';

export interface IMetricsService {
  collectSnapshot(): Promise<TelemetrySnapshot>;
  applyChaosSim(
    snapshot: TelemetrySnapshot,
    chaosFlags: ChaosFlags,
  ): TelemetrySnapshot;
}
/**
 * MetricsService collects real-time system telemetry and provides
 * production-safe chaos simulation capabilities.
 *
 * @see architecture/components/status.md
 */
@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private histogram: IntervalHistogram | null = null;

  constructor(private readonly dataSource: DataSource) {}

  onModuleInit(): void {
    // Initialize event loop monitoring with 20ms resolution
    this.histogram = monitorEventLoopDelay({ resolution: 20 });
    this.histogram.enable();
  }

  onModuleDestroy(): void {
    if (this.histogram) {
      this.histogram.disable();
    }
  }

  /**
   * Collect a snapshot of all system metrics
   */
  async collectSnapshot(): Promise<TelemetrySnapshot> {
    const [dbLatency, dbConnected] = await this.measureDbLatency();
    const memory = process.memoryUsage();

    return {
      timestamp: Date.now(),
      eventLoop: this.getEventLoopMetrics(),
      memory: {
        heapUsedMB: this.bytesToMB(memory.heapUsed),
        heapTotalMB: this.bytesToMB(memory.heapTotal),
        rssMB: this.bytesToMB(memory.rss),
        externalMB: this.bytesToMB(memory.external),
      },
      database: {
        latencyMs: dbLatency,
        connected: dbConnected,
      },
      process: {
        uptimeSeconds: Math.floor(process.uptime()),
        pid: process.pid,
        nodeVersion: process.version,
      },
      chaos: { cpuPressure: false, memoryPressure: false },
    };
  }

  private getEventLoopMetrics(): EventLoopMetrics {
    if (!this.histogram) {
      return {
        lagMs: 0,
        min: 0,
        max: 0,
        mean: 0,
        stddev: 0,
        percentile99: 0,
      };
    }

    // Convert nanoseconds to milliseconds
    const toMs = (ns: number): number => Number((ns / 1_000_000).toFixed(2));

    const metrics: EventLoopMetrics = {
      lagMs: toMs(this.histogram.mean),
      min: toMs(this.histogram.min),
      max: toMs(this.histogram.max),
      mean: toMs(this.histogram.mean),
      stddev: toMs(this.histogram.stddev),
      percentile99: toMs(this.histogram.percentile(99)),
    };

    // Reset histogram for fresh measurements
    this.histogram.reset();

    return metrics;
  }

  private async measureDbLatency(): Promise<[number, boolean]> {
    const start = performance.now();
    try {
      await this.dataSource.query('SELECT 1');
      const latency = Number((performance.now() - start).toFixed(2));
      return [latency, true];
    } catch {
      return [-1, false];
    }
  }

  private bytesToMB(bytes: number): number {
    return Number((bytes / 1024 / 1024).toFixed(2));
  }

  // ─────────────────────────────────────────────────────────────
  // CHAOS SIMULATION METHODS (Production-Safe)
  // ─────────────────────────────────────────────────────────────

  /**
   * Apply chaos simulation to a snapshot.
   * This does NOT actually degrade the server - it modifies the
   * REPORTED metrics to demonstrate what degradation looks like.
   *
   * @param snapshot - Real telemetry snapshot
   * @param chaosFlags - Which chaos simulations to apply
   * @returns Modified snapshot with simulated degradation
   */
  applyChaosSim(
    snapshot: TelemetrySnapshot,
    chaosFlags: ChaosFlags,
  ): TelemetrySnapshot {
    const result = { ...snapshot };

    if (chaosFlags.cpu) {
      // Simulate event loop lag between 50-150ms with jitter
      const baseLag = 50 + Math.random() * 100;
      const jitter = Math.sin(Date.now() / 500) * 20;
      result.eventLoop = {
        ...result.eventLoop,
        lagMs: Number((baseLag + jitter).toFixed(2)),
        max: Number((baseLag + 50).toFixed(2)),
        mean: Number(baseLag.toFixed(2)),
        percentile99: Number((baseLag + 80).toFixed(2)),
      };
      // Simulated DB latency spike (correlated with CPU)
      result.database = {
        ...result.database,
        latencyMs: Number(
          (result.database.latencyMs + baseLag * 0.5).toFixed(2),
        ),
      };
    }

    if (chaosFlags.memory) {
      // Simulate memory pressure: heap growing toward limit
      const pressureMultiplier = 1.5 + Math.random() * 0.5;
      result.memory = {
        ...result.memory,
        heapUsedMB: Number(
          (result.memory.heapUsedMB * pressureMultiplier).toFixed(2),
        ),
        rssMB: Number((result.memory.rssMB * pressureMultiplier).toFixed(2)),
      };
    }

    result.chaos = {
      cpuPressure: chaosFlags.cpu,
      memoryPressure: chaosFlags.memory,
    };

    return result;
  }
}
