import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { EmailAlertChannel } from './email-alert.channel';
import type { LoggerService } from 'server/shared/adapters/logger';
import type { AlertRule, TraceStatsResult } from '../trace-alert.types';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}));

/**
 * Unit tests for EmailAlertChannel.
 * Uses manual dependency injection per project conventions.
 *
 * These are unit tests because the channel interacts with external
 * SMTP services that cannot be easily tested at integration level.
 */
describe('EmailAlertChannel', () => {
  let channel: EmailAlertChannel;
  let mockLogger: jest.Mocked<LoggerService>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockSendMail: jest.Mock;

  const mockRule: AlertRule = {
    name: 'Test Alert',
    metric: 'avgDuration',
    threshold: 100,
    windowMinutes: 5,
    cooldownMinutes: 30,
    channels: ['email'],
    enabled: true,
  };

  const mockStats: TraceStatsResult = {
    totalCount: 100,
    avgDuration: 150,
    errorRate: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    channel = new EmailAlertChannel(mockLogger, mockConfigService);
  });

  describe('channelId', () => {
    it('should have correct channel ID', () => {
      expect(channel.channelId).toBe('email');
    });
  });

  describe('isEnabled', () => {
    it('should return true when all SMTP config is present', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          SMTP_HOST: 'smtp.example.com',
          SMTP_USER: 'user',
          SMTP_PASS: 'pass',
          ALERT_EMAIL_TO: 'admin@example.com',
        };
        return config[key];
      });

      expect(channel.isEnabled()).toBe(true);
    });

    it('should return false when SMTP_HOST is missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string | undefined> = {
          SMTP_HOST: undefined,
          SMTP_USER: 'user',
          SMTP_PASS: 'pass',
          ALERT_EMAIL_TO: 'admin@example.com',
        };
        return config[key];
      });

      expect(channel.isEnabled()).toBe(false);
    });

    it('should return false when SMTP_USER is missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string | undefined> = {
          SMTP_HOST: 'smtp.example.com',
          SMTP_USER: undefined,
          SMTP_PASS: 'pass',
          ALERT_EMAIL_TO: 'admin@example.com',
        };
        return config[key];
      });

      expect(channel.isEnabled()).toBe(false);
    });

    it('should return false when SMTP_PASS is missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string | undefined> = {
          SMTP_HOST: 'smtp.example.com',
          SMTP_USER: 'user',
          SMTP_PASS: undefined,
          ALERT_EMAIL_TO: 'admin@example.com',
        };
        return config[key];
      });

      expect(channel.isEnabled()).toBe(false);
    });

    it('should return false when ALERT_EMAIL_TO is missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string | undefined> = {
          SMTP_HOST: 'smtp.example.com',
          SMTP_USER: 'user',
          SMTP_PASS: 'pass',
          ALERT_EMAIL_TO: undefined,
        };
        return config[key];
      });

      expect(channel.isEnabled()).toBe(false);
    });
  });

  describe('send', () => {
    it('should skip sending when SMTP is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await channel.send(mockRule, mockStats, 150);

      expect(nodemailer.createTransport).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('not configured'),
      );
    });

    it('should send email when SMTP is configured', async () => {
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue?: unknown) => {
          const config: Record<string, string | number> = {
            SMTP_HOST: 'smtp.example.com',
            SMTP_PORT: 587,
            SMTP_USER: 'user',
            SMTP_PASS: 'pass',
            SMTP_FROM: 'noreply@example.com',
            ALERT_EMAIL_TO: 'admin@example.com',
          };
          return config[key] ?? defaultValue;
        },
      );

      await channel.send(mockRule, mockStats, 150);

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.example.com',
          port: 587,
          auth: expect.objectContaining({
            user: 'user',
            pass: 'pass',
          }),
        }),
      );

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@example.com',
          to: 'admin@example.com',
          subject: expect.stringContaining('[Alert] Test Alert'),
          html: expect.stringContaining('Test Alert'),
        }),
      );

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Sent alert email'),
      );
    });

    it('should use port 465 for secure connection', async () => {
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue?: unknown) => {
          const config: Record<string, string | number> = {
            SMTP_HOST: 'smtp.example.com',
            SMTP_PORT: 465,
            SMTP_USER: 'user',
            SMTP_PASS: 'pass',
            SMTP_FROM: 'noreply@example.com',
            ALERT_EMAIL_TO: 'admin@example.com',
          };
          return config[key] ?? defaultValue;
        },
      );

      await channel.send(mockRule, mockStats, 150);

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 465,
          secure: true,
        }),
      );
    });

    it('should log error when email send fails', async () => {
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue?: unknown) => {
          const config: Record<string, string | number> = {
            SMTP_HOST: 'smtp.example.com',
            SMTP_PORT: 587,
            SMTP_USER: 'user',
            SMTP_PASS: 'pass',
            SMTP_FROM: 'noreply@example.com',
            ALERT_EMAIL_TO: 'admin@example.com',
          };
          return config[key] ?? defaultValue;
        },
      );

      mockSendMail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      await channel.send(mockRule, mockStats, 150);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send alert email'),
      );
    });

    it('should use default from address when not configured', async () => {
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue?: unknown) => {
          const config: Record<string, string | number | undefined> = {
            SMTP_HOST: 'smtp.example.com',
            SMTP_PORT: 587,
            SMTP_USER: 'user',
            SMTP_PASS: 'pass',
            SMTP_FROM: undefined,
            ALERT_EMAIL_TO: 'admin@example.com',
          };
          return config[key] ?? defaultValue;
        },
      );

      await channel.send(mockRule, mockStats, 150);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'alerts@example.com',
        }),
      );
    });

    it('should include formatted email body with alert details', async () => {
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue?: unknown) => {
          const config: Record<string, string | number> = {
            SMTP_HOST: 'smtp.example.com',
            SMTP_PORT: 587,
            SMTP_USER: 'user',
            SMTP_PASS: 'pass',
            SMTP_FROM: 'noreply@example.com',
            ALERT_EMAIL_TO: 'admin@example.com',
          };
          return config[key] ?? defaultValue;
        },
      );

      await channel.send(mockRule, mockStats, 150);

      const emailCall = mockSendMail.mock.calls[0][0];
      const htmlBody = emailCall.html as string;

      expect(htmlBody).toContain('Test Alert');
      expect(htmlBody).toContain('avgDuration');
      expect(htmlBody).toContain('100'); // threshold
      expect(htmlBody).toContain('150.00'); // actual value
      expect(htmlBody).toContain('5 minutes'); // window
      expect(htmlBody).toContain('100'); // total count
    });
  });
});
