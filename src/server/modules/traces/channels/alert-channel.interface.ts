import type { AlertRule, TraceStatsResult } from '../trace-alert.types';

/**
 * Interface for alert channel implementations.
 * Each channel is responsible for sending alerts through a specific medium.
 */
export interface IAlertChannel {
  /**
   * Unique identifier for this channel.
   */
  readonly channelId: string;

  /**
   * Sends an alert through this channel.
   * @param rule - The alert rule that was triggered
   * @param stats - Current trace statistics
   * @param actualValue - The actual metric value that triggered the alert
   */
  send(
    rule: AlertRule,
    stats: TraceStatsResult,
    actualValue: number,
  ): Promise<void>;

  /**
   * Check if the channel is configured and available.
   */
  isEnabled(): boolean;
}
