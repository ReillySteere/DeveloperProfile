import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoggerService, LOGGER_TOKENS } from 'server/shared/adapters/logger';
import { AlertHistory } from './alert-history.entity';
import {
  defaultAlertRules,
  type AlertRule,
  type AlertEvent,
} from './alert.config';
import type { WindowStats, AlertCheckResult } from './trace-alert.types';
import type { ITraceRepository } from './trace.types';
import TOKENS from './tokens';
import { TRACE_EVENTS } from './events';
import {
  IAlertChannel,
  SentryAlertChannel,
  LogAlertChannel,
  EmailAlertChannel,
} from './channels';

/**
 * Alert service for monitoring trace metrics and triggering alerts.
 *
 * Features:
 * - Periodic metric evaluation (every minute)
 * - Configurable alert rules with thresholds
 * - Cooldown period to prevent alert spam
 * - Multi-channel alert delivery (Sentry, Email, Log)
 * - Alert history persistence for audit trail
 */
@Injectable()
export class TraceAlertService implements OnModuleInit {
  readonly #repository: ITraceRepository;
  readonly #alertHistoryRepo: Repository<AlertHistory>;
  readonly #logger: LoggerService;
  readonly #eventEmitter: EventEmitter2;
  readonly #channels: Map<string, IAlertChannel> = new Map();
  readonly #alertRules: AlertRule[];
  readonly #cooldowns: Map<string, Date> = new Map();

  constructor(
    @Inject(TOKENS.ITraceRepository)
    repository: ITraceRepository,
    @InjectRepository(AlertHistory)
    alertHistoryRepo: Repository<AlertHistory>,
    @Inject(LOGGER_TOKENS.LoggerService)
    logger: LoggerService,
    eventEmitter: EventEmitter2,
    sentryChannel: SentryAlertChannel,
    logChannel: LogAlertChannel,
    emailChannel: EmailAlertChannel,
  ) {
    this.#repository = repository;
    this.#alertHistoryRepo = alertHistoryRepo;
    this.#logger = logger;
    this.#eventEmitter = eventEmitter;
    this.#alertRules = [...defaultAlertRules];

    // Register channels
    this.#channels.set('sentry', sentryChannel);
    this.#channels.set('log', logChannel);
    this.#channels.set('email', emailChannel);
  }

  onModuleInit(): void {
    this.#logger.log(
      `TraceAlertService initialized with ${this.#alertRules.length} rules`,
    );
  }

  /**
   * Scheduled job: evaluates all alert rules every minute.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkAlerts(): Promise<AlertCheckResult[]> {
    const results: AlertCheckResult[] = [];

    for (const rule of this.#alertRules) {
      if (!rule.enabled) {
        continue;
      }

      try {
        const result = await this.evaluateRule(rule);
        results.push(result);

        if (result.triggered && !result.inCooldown) {
          await this.triggerAlert(rule, result.currentValue);
        }
      } catch (error) {
        this.#logger.error(
          `TraceAlertService: Error evaluating rule "${rule.name}": ${error}`,
        );
      }
    }

    return results;
  }

  /**
   * Evaluates a single alert rule against current metrics.
   */
  async evaluateRule(rule: AlertRule): Promise<AlertCheckResult> {
    const stats = await this.getWindowStats(rule.windowMinutes);
    const currentValue = this.getMetricValue(rule.metric, stats);
    const triggered = currentValue > rule.threshold;
    const inCooldown = this.isInCooldown(rule.name);

    return {
      ruleName: rule.name,
      triggered,
      currentValue,
      threshold: rule.threshold,
      inCooldown,
    };
  }

  /**
   * Triggers an alert for a rule and sends to configured channels.
   */
  async triggerAlert(rule: AlertRule, currentValue: number): Promise<void> {
    this.#logger.warn(
      `TraceAlertService: Alert triggered - ${rule.name} (${rule.metric}: ${currentValue.toFixed(2)} > ${rule.threshold})`,
    );

    // Set cooldown
    this.setCooldown(rule.name, rule.cooldownMinutes);

    // Get stats for context
    const stats = await this.#repository.getStats();

    // Record in history
    const historyEntry = this.#alertHistoryRepo.create({
      ruleName: rule.name,
      metric: rule.metric,
      threshold: rule.threshold,
      actualValue: currentValue,
      channels: rule.channels,
      resolved: false,
    });
    await this.#alertHistoryRepo.save(historyEntry);

    // Send to channels
    for (const channelId of rule.channels) {
      const channel = this.#channels.get(channelId);
      if (channel?.isEnabled()) {
        try {
          await channel.send(rule, stats, currentValue);
        } catch (error) {
          this.#logger.error(
            `TraceAlertService: Failed to send to ${channelId}: ${error}`,
          );
        }
      }
    }

    // Emit event for SSE and other listeners
    const event: AlertEvent = {
      rule,
      currentValue,
      triggeredAt: new Date(),
      context: {
        windowMinutes: rule.windowMinutes,
        totalRequests: stats.totalCount,
      },
    };
    this.#eventEmitter.emit(TRACE_EVENTS.ALERT_TRIGGERED, event);
  }

  /**
   * Gets statistics for a time window.
   */
  async getWindowStats(windowMinutes: number): Promise<WindowStats> {
    // Use hourly stats and filter to the window
    // Convert minutes to hours (minimum 1 hour for the API)
    const hours = Math.max(1, Math.ceil(windowMinutes / 60));
    const hourlyStats = await this.#repository.getHourlyStats(hours);

    // If we have recent data, use it; otherwise fall back to overall stats
    if (hourlyStats.length > 0) {
      const recent = hourlyStats[hourlyStats.length - 1];
      return {
        totalCount: recent.count,
        avgDuration: recent.avgDuration,
        errorRate: recent.errorRate,
        p95Duration: recent.p95Duration,
      };
    }

    // Fall back to overall stats (without p95)
    const stats = await this.#repository.getStats();
    return {
      ...stats,
      p95Duration: stats.avgDuration * 2, // Rough estimate
    };
  }

  /**
   * Extracts the metric value from stats.
   */
  private getMetricValue(
    metric: 'avgDuration' | 'errorRate' | 'p95Duration',
    stats: WindowStats,
  ): number {
    switch (metric) {
      case 'avgDuration':
        return stats.avgDuration;
      case 'errorRate':
        return stats.errorRate;
      case 'p95Duration':
        return stats.p95Duration;
    }
  }

  /**
   * Checks if a rule is in cooldown period.
   */
  private isInCooldown(ruleName: string): boolean {
    const cooldownUntil = this.#cooldowns.get(ruleName);
    if (!cooldownUntil) {
      return false;
    }
    return new Date() < cooldownUntil;
  }

  /**
   * Sets cooldown for a rule.
   */
  private setCooldown(ruleName: string, minutes: number): void {
    const cooldownUntil = new Date(Date.now() + minutes * 60 * 1000);
    this.#cooldowns.set(ruleName, cooldownUntil);
  }

  /**
   * Gets recent alert history.
   */
  async getRecentAlerts(limit: number = 20): Promise<AlertHistory[]> {
    return this.#alertHistoryRepo.find({
      order: { triggeredAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Gets unresolved alerts.
   */
  async getUnresolvedAlerts(): Promise<AlertHistory[]> {
    return this.#alertHistoryRepo.find({
      where: { resolved: false },
      order: { triggeredAt: 'DESC' },
    });
  }

  /**
   * Resolves an alert.
   */
  async resolveAlert(id: number, notes?: string): Promise<AlertHistory | null> {
    const alert = await this.#alertHistoryRepo.findOne({ where: { id } });
    if (!alert) {
      return null;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    if (notes) {
      alert.notes = notes;
    }

    return this.#alertHistoryRepo.save(alert);
  }

  /**
   * Clears cooldown for a rule (for testing).
   */
  clearCooldown(ruleName: string): void {
    this.#cooldowns.delete(ruleName);
  }

  /**
   * Gets all configured alert rules.
   */
  getAlertRules(): AlertRule[] {
    return [...this.#alertRules];
  }

  /**
   * Cleanup old alert history.
   * Runs daily.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldAlerts(): Promise<number> {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days

    const result = await this.#alertHistoryRepo
      .createQueryBuilder()
      .delete()
      .where('triggeredAt < :cutoffDate AND resolved = :resolved', {
        cutoffDate,
        resolved: true,
      })
      .execute();

    const deleted = result.affected ?? 0;
    if (deleted > 0) {
      this.#logger.log(`TraceAlertService: Cleaned up ${deleted} old alerts`);
    }

    return deleted;
  }
}
