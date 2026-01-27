import * as Sentry from '@sentry/node';
import { SentryAlertChannel } from './sentry-alert.channel';
import type { LoggerService } from 'server/shared/adapters/logger';
import type { AlertRule, TraceStatsResult } from '../trace-alert.types';

jest.mock('@sentry/node', () => ({
  captureMessage: jest.fn(),
}));

/**
 * Unit tests for SentryAlertChannel.
 * Uses manual dependency injection per project conventions.
 *
 * These are unit tests because the channel interacts with an external
 * service (Sentry) that cannot be easily tested at integration level.
 */
describe('SentryAlertChannel', () => {
  let channel: SentryAlertChannel;
  let mockLogger: jest.Mocked<LoggerService>;

  const mockRule: AlertRule = {
    name: 'Test Alert',
    metric: 'avgDuration',
    threshold: 100,
    windowMinutes: 5,
    cooldownMinutes: 30,
    channels: ['sentry'],
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

    channel = new SentryAlertChannel(mockLogger);
  });

  describe('channelId', () => {
    it('should have correct channel ID', () => {
      expect(channel.channelId).toBe('sentry');
    });
  });

  describe('isEnabled', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return true when SENTRY_DSN is set', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      expect(channel.isEnabled()).toBe(true);
    });

    it('should return false when SENTRY_DSN is not set', () => {
      delete process.env.SENTRY_DSN;
      expect(channel.isEnabled()).toBe(false);
    });
  });

  describe('send', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should skip sending when Sentry is not configured', async () => {
      delete process.env.SENTRY_DSN;

      await channel.send(mockRule, mockStats, 150);

      expect(Sentry.captureMessage).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('not configured'),
      );
    });

    it('should send alert to Sentry when configured', async () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      await channel.send(mockRule, mockStats, 150);

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining('[Alert] Test Alert'),
        expect.objectContaining({
          level: 'warning', // 150/100 = 1.5x exactly, so warning
          tags: expect.objectContaining({
            component: 'TraceAlertService',
            metric: 'avgDuration',
          }),
          extra: expect.objectContaining({
            threshold: 100,
            actualValue: 150,
          }),
        }),
      );
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it('should use info severity when value is under 1.5x threshold', async () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      await channel.send(mockRule, mockStats, 140); // 140/100 = 1.4x

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          level: 'info',
        }),
      );
    });

    it('should use warning severity when value is 1.5x-2x threshold', async () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      await channel.send(mockRule, mockStats, 175); // 175/100 = 1.75x

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          level: 'warning',
        }),
      );
    });

    it('should use error severity when value is 2x+ threshold', async () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';

      await channel.send(mockRule, mockStats, 250); // 250/100 = 2.5x

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          level: 'error',
        }),
      );
    });
  });
});
