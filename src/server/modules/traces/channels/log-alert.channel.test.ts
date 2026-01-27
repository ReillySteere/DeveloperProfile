import { LogAlertChannel } from './log-alert.channel';
import type { LoggerService } from 'server/shared/adapters/logger';
import type { AlertRule, TraceStatsResult } from '../trace-alert.types';

/**
 * Unit tests for LogAlertChannel.
 * Uses manual dependency injection per project conventions.
 */
describe('LogAlertChannel', () => {
  let channel: LogAlertChannel;
  let mockLogger: jest.Mocked<LoggerService>;

  const mockRule: AlertRule = {
    name: 'Test Alert',
    metric: 'avgDuration',
    threshold: 100,
    windowMinutes: 5,
    cooldownMinutes: 30,
    channels: ['log'],
    enabled: true,
  };

  const mockStats: TraceStatsResult = {
    totalCount: 100,
    avgDuration: 150,
    errorRate: 2,
  };

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    channel = new LogAlertChannel(mockLogger);
  });

  describe('channelId', () => {
    it('should have correct channel ID', () => {
      expect(channel.channelId).toBe('log');
    });
  });

  describe('isEnabled', () => {
    it('should always return true (log is always available)', () => {
      expect(channel.isEnabled()).toBe(true);
    });
  });

  describe('send', () => {
    it('should log alert with formatted message', async () => {
      await channel.send(mockRule, mockStats, 150);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('[ALERT] Test Alert'),
      );
    });

    it('should include all relevant information in log message', async () => {
      await channel.send(mockRule, mockStats, 150);

      const loggedMessage = mockLogger.warn.mock.calls[0][0] as string;

      expect(loggedMessage).toContain('Metric: avgDuration');
      expect(loggedMessage).toContain('Threshold: 100');
      expect(loggedMessage).toContain('Actual: 150.00');
      expect(loggedMessage).toContain('Window: 5 minutes');
      expect(loggedMessage).toContain('100 requests');
    });

    it('should format stats with proper precision', async () => {
      const statsWithDecimals: TraceStatsResult = {
        totalCount: 50,
        avgDuration: 123.456,
        errorRate: 3.789,
      };

      await channel.send(mockRule, statsWithDecimals, 200);

      const loggedMessage = mockLogger.warn.mock.calls[0][0] as string;

      expect(loggedMessage).toContain('123.46ms avg');
      expect(loggedMessage).toContain('3.79% errors');
    });
  });
});
