/**
 * Types for the trace alert service.
 * Re-exports and extends types from alert.config.ts and trace.types.ts.
 */

export type { AlertChannel, AlertRule, AlertEvent } from './alert.config';
export type { TraceStatsResult } from './trace.types';

/**
 * Window stats with p95 duration for alert evaluation.
 */
export interface WindowStats {
  totalCount: number;
  avgDuration: number;
  errorRate: number;
  p95Duration: number;
}

/**
 * Alert check result.
 */
export interface AlertCheckResult {
  ruleName: string;
  triggered: boolean;
  currentValue: number;
  threshold: number;
  inCooldown: boolean;
}
