import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { IAlertChannel } from './alert-channel.interface';
import type { AlertRule, TraceStatsResult } from '../trace-alert.types';
import { LoggerService, LOGGER_TOKENS } from 'server/shared/adapters/logger';

/**
 * Email alert channel.
 * Sends alerts via SMTP.
 * Requires SMTP_* environment variables to be configured.
 */
@Injectable()
export class EmailAlertChannel implements IAlertChannel {
  readonly channelId = 'email';

  readonly #logger: LoggerService;
  readonly #configService: ConfigService;

  constructor(
    @Inject(LOGGER_TOKENS.LoggerService)
    logger: LoggerService,
    configService: ConfigService,
  ) {
    this.#logger = logger;
    this.#configService = configService;
  }

  isEnabled(): boolean {
    // Check if all required SMTP config is present
    const host = this.#configService.get<string>('SMTP_HOST');
    const user = this.#configService.get<string>('SMTP_USER');
    const pass = this.#configService.get<string>('SMTP_PASS');
    const to = this.#configService.get<string>('ALERT_EMAIL_TO');
    return !!(host && user && pass && to);
  }

  async send(
    rule: AlertRule,
    stats: TraceStatsResult,
    actualValue: number,
  ): Promise<void> {
    if (!this.isEnabled()) {
      this.#logger.warn(
        'EmailAlertChannel: SMTP not configured, skipping alert',
      );
      return;
    }

    try {
      const transporter = this.createTransporter();

      await transporter.sendMail({
        from: this.#configService.get<string>(
          'SMTP_FROM',
          'alerts@example.com',
        ),
        to: this.#configService.get<string>('ALERT_EMAIL_TO'),
        subject: `[Alert] ${rule.name} threshold exceeded`,
        html: this.formatEmailBody(rule, stats, actualValue),
      });

      this.#logger.log(
        `EmailAlertChannel: Sent alert email for "${rule.name}"`,
      );
    } catch (error) {
      this.#logger.error(
        `EmailAlertChannel: Failed to send alert email: ${error}`,
      );
    }
  }

  private createTransporter(): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: this.#configService.get<string>('SMTP_HOST'),
      port: this.#configService.get<number>('SMTP_PORT', 587),
      secure: this.#configService.get<number>('SMTP_PORT', 587) === 465,
      auth: {
        user: this.#configService.get<string>('SMTP_USER'),
        pass: this.#configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private formatEmailBody(
    rule: AlertRule,
    stats: TraceStatsResult,
    actualValue: number,
  ): string {
    const timestamp = new Date().toISOString();

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .value { font-weight: bold; }
    .threshold { color: #6b7280; }
    .exceeded { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⚠️ ${rule.name}</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Alert triggered at ${timestamp}</p>
    </div>
    <div class="content">
      <div class="metric">
        <span>Metric</span>
        <span class="value">${rule.metric}</span>
      </div>
      <div class="metric">
        <span>Threshold</span>
        <span class="threshold">${rule.threshold}</span>
      </div>
      <div class="metric">
        <span>Actual Value</span>
        <span class="value exceeded">${actualValue.toFixed(2)}</span>
      </div>
      <div class="metric">
        <span>Window</span>
        <span>${rule.windowMinutes} minutes</span>
      </div>
      <h3>Statistics</h3>
      <div class="metric">
        <span>Total Requests</span>
        <span>${stats.totalCount}</span>
      </div>
      <div class="metric">
        <span>Avg Duration</span>
        <span>${stats.avgDuration.toFixed(2)}ms</span>
      </div>
      <div class="metric">
        <span>Error Rate</span>
        <span>${stats.errorRate.toFixed(2)}%</span>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
