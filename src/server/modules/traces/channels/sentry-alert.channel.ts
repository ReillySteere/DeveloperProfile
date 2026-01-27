import { Injectable, Inject } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import type { IAlertChannel } from './alert-channel.interface';
import type { AlertRule, TraceStatsResult } from '../trace-alert.types';
import { LoggerService, LOGGER_TOKENS } from 'server/shared/adapters/logger';

/**
 * Sentry alert channel.
 * Sends alerts as Sentry events with appropriate severity levels.
 */
@Injectable()
export class SentryAlertChannel implements IAlertChannel {
  readonly channelId = 'sentry';

  readonly #logger: LoggerService;

  constructor(
    @Inject(LOGGER_TOKENS.LoggerService)
    logger: LoggerService,
  ) {
    this.#logger = logger;
  }

  isEnabled(): boolean {
    // Sentry is enabled if DSN is configured
    return !!process.env.SENTRY_DSN;
  }

  async send(
    rule: AlertRule,
    stats: TraceStatsResult,
    actualValue: number,
  ): Promise<void> {
    if (!this.isEnabled()) {
      this.#logger.warn(
        'SentryAlertChannel: Sentry not configured, skipping alert',
      );
      return;
    }

    const severity = this.getSeverity(rule, actualValue);

    Sentry.captureMessage(`[Alert] ${rule.name}: ${rule.metric} exceeded`, {
      level: severity,
      tags: {
        component: 'TraceAlertService',
        alert: rule.name.toLowerCase().replace(/\s+/g, '-'),
        metric: rule.metric,
      },
      extra: {
        threshold: rule.threshold,
        actualValue,
        windowMinutes: rule.windowMinutes,
        stats: {
          totalCount: stats.totalCount,
          avgDuration: stats.avgDuration.toFixed(2),
          errorRate: stats.errorRate.toFixed(2),
        },
      },
    });

    this.#logger.log(
      `SentryAlertChannel: Sent alert for "${rule.name}" (${rule.metric}: ${actualValue.toFixed(2)} > ${rule.threshold})`,
    );
  }

  private getSeverity(
    rule: AlertRule,
    actualValue: number,
  ): Sentry.SeverityLevel {
    // Calculate how much the threshold is exceeded
    const exceedRatio = actualValue / rule.threshold;

    if (exceedRatio >= 2) {
      return 'error'; // More than 2x threshold
    }
    if (exceedRatio >= 1.5) {
      return 'warning'; // 1.5x to 2x threshold
    }
    return 'info'; // Just over threshold
  }
}
