import { Test, TestingModule } from '@nestjs/testing';

// Only import from public module API and adapters - no internal visibility
import { LoggerModule } from '../../modules/logger';
import {
  LoggingAdapter,
  LOGGER_ADAPTER_TOKENS,
  LogContext,
  LogLevel,
  LogEntry,
} from './index';
import { ILoggingPort, LogContext as PortLogContext } from '../../ports';

/**
 * Integration tests for Logger functionality as consumed by business modules.
 *
 * These tests verify the adapter-based interface that consumers use:
 * - LoggingAdapter port implementation
 * - Context setting
 * - All log level methods
 *
 * NO visibility into internal module implementation details (AppLoggerService internals).
 * Internal module tests are in src/server/shared/modules/logger/
 */
describe('Logger Module (Consumer API)', () => {
  let module: TestingModule;
  let loggingAdapter: ILoggingPort;

  // Capture console output
  let consoleSpy: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: LOGGER_ADAPTER_TOKENS.Logger,
          useClass: LoggingAdapter,
        },
      ],
    }).compile();

    loggingAdapter = module.get<ILoggingPort>(LOGGER_ADAPTER_TOKENS.Logger);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('LoggingAdapter (Port Interface)', () => {
    describe('setContext', () => {
      it('should set context for subsequent log messages', () => {
        loggingAdapter.setContext('BusinessModule');
        loggingAdapter.log('context test');

        // Adapter formats context and passes to underlying logger
        expect(consoleSpy.log).toHaveBeenCalled();
        const firstArg = consoleSpy.log.mock.calls[0][0];
        expect(firstArg).toContain('[BusinessModule]');
      });
    });

    describe('log', () => {
      it('should log messages via port interface', () => {
        loggingAdapter.log('adapter log message');

        expect(consoleSpy.log).toHaveBeenCalled();
      });

      it('should accept metadata matching LogContext interface', () => {
        loggingAdapter.log('message with context', {
          service: 'TestService',
          requestId: 'req-123',
          customField: 'value',
        });

        expect(consoleSpy.log).toHaveBeenCalled();
      });
    });

    describe('error', () => {
      it('should log error messages via port interface', () => {
        loggingAdapter.error('adapter error message');

        expect(consoleSpy.log).toHaveBeenCalled();
      });

      it('should accept metadata for error context', () => {
        loggingAdapter.error('error with context', {
          service: 'TestService',
          errorCode: 'ERR_001',
        });

        expect(consoleSpy.log).toHaveBeenCalled();
      });
    });

    describe('warn', () => {
      it('should log warning messages via port interface', () => {
        loggingAdapter.warn('adapter warning message');

        expect(consoleSpy.log).toHaveBeenCalled();
      });

      it('should accept metadata for warning context', () => {
        loggingAdapter.warn('warning with context', {
          service: 'TestService',
          threshold: 80,
        });

        expect(consoleSpy.log).toHaveBeenCalled();
      });
    });

    describe('debug', () => {
      it('should log debug messages via port interface', () => {
        loggingAdapter.debug('adapter debug message');

        expect(consoleSpy.log).toHaveBeenCalled();
      });

      it('should accept metadata for debug context', () => {
        loggingAdapter.debug('debug with context', {
          service: 'TestService',
          data: { key: 'value' },
        });

        expect(consoleSpy.log).toHaveBeenCalled();
      });
    });

    describe('verbose', () => {
      it('should log verbose messages via port interface', () => {
        loggingAdapter.verbose('adapter verbose message');

        expect(consoleSpy.log).toHaveBeenCalled();
      });

      it('should accept metadata for verbose context', () => {
        loggingAdapter.verbose('verbose with context', {
          service: 'TestService',
          details: 'extensive info',
        });

        expect(consoleSpy.log).toHaveBeenCalled();
      });
    });
  });

  describe('Metadata Formatting', () => {
    it('should format metadata with context included', () => {
      loggingAdapter.setContext('FormattingTest');
      loggingAdapter.log('formatted message', { requestId: 'test-123' });

      // The adapter formats meta as JSON string containing context and meta
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle undefined metadata gracefully', () => {
      loggingAdapter.setContext('NoMetaTest');
      loggingAdapter.log('no meta message');

      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('Type Exports', () => {
    it('should export LogContext type compatible with port interface', () => {
      // Verify adapter LogContext is assignable to port LogContext
      const adapterContext: LogContext = {
        service: 'TestService',
        requestId: 'req-456',
      };
      const portContext: PortLogContext = adapterContext;

      expect(portContext.service).toBe('TestService');
    });

    it('should export LogLevel type with valid values', () => {
      const levels: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
      expect(levels).toHaveLength(5);
    });

    it('should export LogEntry interface for structured logging', () => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'log',
        message: 'test entry',
        context: 'TestContext',
        meta: { customField: 'value' },
      };

      expect(entry.level).toBe('log');
      expect(entry.message).toBe('test entry');
    });
  });

  describe('Minimal Logger Fallback', () => {
    // Test branches where underlying logger lacks optional methods
    it('should handle logger without setContext method', () => {
      const minimalLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        // No debug, verbose, or setContext
      };

      // Create adapter with minimal logger directly
      const adapter = new LoggingAdapter(minimalLogger as never);

      // Should not throw when setContext is called
      expect(() => adapter.setContext('TestContext')).not.toThrow();
    });

    it('should handle logger without debug method', () => {
      const minimalLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        // No debug
      };

      const adapter = new LoggingAdapter(minimalLogger as never);

      // Should not throw when debug is called
      expect(() => adapter.debug('debug message')).not.toThrow();
    });

    it('should handle logger without verbose method', () => {
      const minimalLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        // No verbose
      };

      const adapter = new LoggingAdapter(minimalLogger as never);

      // Should not throw when verbose is called
      expect(() => adapter.verbose('verbose message')).not.toThrow();
    });
  });
});
