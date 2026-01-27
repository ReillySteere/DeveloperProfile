import { Injectable, Inject } from '@nestjs/common';
import type { IAlertChannel } from './alert-channel.interface';
import type { AlertRule, TraceStatsResult } from '../trace-alert.types';
import { LoggerService, LOGGER_TOKENS } from 'server/shared/adapters/logger';

/**
 * Log alert channel.
 * Outputs alerts to the application logger.
 * Always enabled as a fallback channel.
 */
@Injectable()
export class LogAlertChannel implements IAlertChannel {
  readonly channelId = 'log';

  readonly #logger: LoggerService;

  constructor(
    @Inject(LOGGER_TOKENS.LoggerService)
    logger: LoggerService,
  ) {
    this.#logger = logger;
  }

  isEnabled(): boolean {
    // Log channel is always enabled
    return true;
  }

  async send(
    rule: AlertRule,
    stats: TraceStatsResult,
    actualValue: number,
  ): Promise<void> {
    const message = this.formatAlertMessage(rule, stats, actualValue);
    this.#logger.warn(message);
  }

  private formatAlertMessage(
    rule: AlertRule,
    stats: TraceStatsResult,
    actualValue: number,
  ): string {
    const lines = [
      `[ALERT] ${rule.name}`,
      `  Metric: ${rule.metric}`,
      `  Threshold: ${rule.threshold}`,
      `  Actual: ${actualValue.toFixed(2)}`,
      `  Window: ${rule.windowMinutes} minutes`,
      `  Stats: ${stats.totalCount} requests, ${stats.avgDuration.toFixed(2)}ms avg, ${stats.errorRate.toFixed(2)}% errors`,
    ];
    return lines.join('\n');
  }
}
