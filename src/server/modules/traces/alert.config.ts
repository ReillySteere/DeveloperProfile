/**
 * Alert configuration for trace monitoring.
 * Defines alert rules, channels, and thresholds.
 */

/**
 * Available alert channels.
 */
export type AlertChannel = 'sentry' | 'email' | 'log';

/**
 * Alert rule definition.
 */
export interface AlertRule {
  /** Human-readable name for the alert */
  name: string;
  /** Metric to monitor */
  metric: 'avgDuration' | 'errorRate' | 'p95Duration';
  /** Threshold value that triggers the alert */
  threshold: number;
  /** Time window in minutes to evaluate */
  windowMinutes: number;
  /** Cooldown period in minutes before re-alerting */
  cooldownMinutes: number;
  /** Channels to send alerts to */
  channels: AlertChannel[];
  /** Whether the alert is enabled */
  enabled: boolean;
}

/**
 * Default alert rules.
 * These can be overridden via environment variables or admin API.
 */
export const defaultAlertRules: AlertRule[] = [
  {
    name: 'High Latency',
    metric: 'avgDuration',
    threshold: 500, // 500ms average
    windowMinutes: 5,
    cooldownMinutes: 30,
    channels: ['sentry', 'log'],
    enabled: true,
  },
  {
    name: 'High Error Rate',
    metric: 'errorRate',
    threshold: 5, // 5% error rate
    windowMinutes: 5,
    cooldownMinutes: 30,
    channels: ['sentry', 'log'],
    enabled: true,
  },
  {
    name: 'P95 Latency Spike',
    metric: 'p95Duration',
    threshold: 1000, // 1 second p95
    windowMinutes: 5,
    cooldownMinutes: 60,
    channels: ['sentry', 'log'],
    enabled: true,
  },
  // Example disabled rule - demonstrates the feature
  {
    name: 'Extreme Latency (Disabled)',
    metric: 'avgDuration',
    threshold: 5000, // 5 second average - very high
    windowMinutes: 15,
    cooldownMinutes: 120,
    channels: ['email'],
    enabled: false,
  },
];

/**
 * Alert event payload emitted when an alert is triggered.
 */
export interface AlertEvent {
  /** Alert rule that was triggered */
  rule: AlertRule;
  /** Current metric value that exceeded threshold */
  currentValue: number;
  /** When the alert was triggered */
  triggeredAt: Date;
  /** Additional context about the alert */
  context: {
    windowMinutes: number;
    totalRequests: number;
  };
}

/**
 * Alert history record for persistence.
 */
export interface AlertHistoryRecord {
  id: number;
  ruleName: string;
  metric: string;
  threshold: number;
  actualValue: number;
  triggeredAt: Date;
  channels: string[];
  resolved: boolean;
  resolvedAt?: Date;
}
