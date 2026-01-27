/**
 * Trace module types.
 * Separated from implementation to allow unit testing without TypeORM.
 */

// Import from shared ports for use in this file
import type {
  PhaseTiming as PhaseTiming_,
  CreateTraceInput as CreateTraceInput_,
  IRequestTrace as IRequestTrace_,
  ITraceServicePort as ITraceServicePort_,
} from 'server/shared/ports';

// Re-export shared port types used by the module
export type PhaseTiming = PhaseTiming_;
export type CreateTraceInput = CreateTraceInput_;
export type IRequestTrace = IRequestTrace_;
export type ITraceServicePort = ITraceServicePort_;

/**
 * Filter options for querying traces.
 */
export interface TraceFilters {
  method?: string;
  path?: string;
  statusCode?: number;
  minDuration?: number;
  maxDuration?: number;
  limit?: number;
  offset?: number;
}

/**
 * Trace statistics result.
 */
export interface TraceStatsResult {
  totalCount: number;
  avgDuration: number;
  errorRate: number;
}

/**
 * Hourly statistics for trend visualization.
 */
export interface HourlyStatsResult {
  hour: string;
  count: number;
  avgDuration: number;
  errorRate: number;
  p95Duration: number;
}

/**
 * Per-endpoint statistics for breakdown visualization.
 */
export interface EndpointStatsResult {
  path: string;
  method: string;
  count: number;
  avgDuration: number;
  errorRate: number;
}

/**
 * Repository interface for trace storage.
 */
export interface ITraceRepository {
  create(trace: Partial<IRequestTrace>): Promise<IRequestTrace>;
  findRecent(filters?: TraceFilters): Promise<IRequestTrace[]>;
  findById(traceId: string): Promise<IRequestTrace | null>;
  deleteOlderThan(date: Date): Promise<number>;
  count(): Promise<number>;
  getStats(): Promise<TraceStatsResult>;
  getHourlyStats(hours?: number): Promise<HourlyStatsResult[]>;
  getEndpointStats(limit?: number): Promise<EndpointStatsResult[]>;
}

/**
 * Service interface for trace operations.
 * Extends the port interface with additional functionality.
 */
export interface ITraceService extends ITraceServicePort {
  getRecentTraces(filters?: TraceFilters): Promise<IRequestTrace[]>;
  getTraceById(traceId: string): Promise<IRequestTrace | null>;
  cleanupOldTraces(): Promise<number>;
  checkDatabaseSize(): Promise<void>;
  getTraceCount(): Promise<number>;
  getStats(): Promise<TraceStatsResult>;
  getHourlyStats(hours?: number): Promise<HourlyStatsResult[]>;
  getEndpointStats(limit?: number): Promise<EndpointStatsResult[]>;
}
