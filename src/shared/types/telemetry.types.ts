/**
 * Telemetry types for Mission Control dashboard
 * @see architecture/components/status.md
 */

/**
 * A snapshot of system telemetry data collected at a specific point in time.
 * Streamed via SSE from /api/health/stream
 */
export interface TelemetrySnapshot {
  /** Unix timestamp in milliseconds */
  timestamp: number;

  /** Node.js event loop metrics from perf_hooks */
  eventLoop: EventLoopMetrics;

  /** V8 and process memory usage */
  memory: MemoryMetrics;

  /** Database connection health and latency */
  database: DatabaseMetrics;

  /** Node.js process information */
  process: ProcessMetrics;

  /** Current chaos simulation state */
  chaos: ChaosState;
}

export interface EventLoopMetrics {
  /** Current event loop lag in milliseconds */
  lagMs: number;
  /** Minimum lag observed in measurement window */
  min: number;
  /** Maximum lag observed in measurement window */
  max: number;
  /** Mean lag over measurement window */
  mean: number;
  /** Standard deviation of lag measurements */
  stddev: number;
  /** 99th percentile lag (tail latency) */
  percentile99: number;
}

export interface MemoryMetrics {
  /** V8 heap used in megabytes */
  heapUsedMB: number;
  /** V8 total heap size in megabytes */
  heapTotalMB: number;
  /** Resident Set Size in megabytes (total process memory) */
  rssMB: number;
  /** External memory (C++ objects bound to JS) in megabytes */
  externalMB: number;
}

export interface DatabaseMetrics {
  /** Time to execute SELECT 1 in milliseconds */
  latencyMs: number;
  /** Whether database connection is established */
  connected: boolean;
}

export interface ProcessMetrics {
  /** Process uptime in seconds */
  uptimeSeconds: number;
  /** Process ID */
  pid: number;
  /** Node.js version string */
  nodeVersion: string;
}

export interface ChaosState {
  /** Whether CPU pressure simulation is active */
  cpuPressure: boolean;
  /** Whether memory pressure simulation is active */
  memoryPressure: boolean;
}

/**
 * Chaos flags that can be passed to the SSE endpoint
 */
export interface ChaosFlags {
  cpu: boolean;
  memory: boolean;
}
