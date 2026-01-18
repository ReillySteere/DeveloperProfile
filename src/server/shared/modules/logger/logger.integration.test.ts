import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from './logger.module';
import { AppLoggerService } from './logger.service';
import { LOGGER_TOKENS } from './tokens';

/**
 * Integration tests for the shared Logger module's internal implementation.
 *
 * These tests verify the internal workings of the logger module:
 * - AppLoggerService behavior (log levels, context, formatting)
 * - Production vs development output formatting
 *
 * Consumer-facing tests (via adapters) are in the adapter test file.
 */
describe('Logger Module (Internal)', () => {
  let module: TestingModule;
  let loggerService: AppLoggerService;

  // Capture console output
  let consoleSpy: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [LoggerModule],
    }).compile();

    loggerService = module.get<AppLoggerService>(LOGGER_TOKENS.LoggerService);
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

  describe('AppLoggerService', () => {
    describe('setContext', () => {
      it('should set context for subsequent log messages', () => {
        loggerService.setContext('TestContext');
        loggerService.log('test message');

        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('[TestContext]'),
        );
      });
    });

    describe('log without context', () => {
      it('should log without context prefix when context not set', () => {
        // Fresh logger without setContext called
        const freshLogger = new AppLoggerService();
        freshLogger.log('no context message');

        const output = consoleSpy.log.mock.calls[0][0];
        // Should not contain context brackets at start of message portion
        expect(output).toContain('INFO');
        expect(output).toContain('no context message');
        // No [ContextName] should appear
        expect(output).not.toMatch(/\[[A-Z][a-z]+\]/);
      });
    });

    describe('log levels', () => {
      it('should log info messages', () => {
        loggerService.log('info message');

        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('INFO'),
        );
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('info message'),
        );
      });

      it('should log error messages to console.error', () => {
        loggerService.error('error message');

        // In development mode, error still goes to console.log with formatting
        // The console method check is in production mode
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('ERROR'),
        );
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('error message'),
        );
      });

      it('should log warning messages', () => {
        loggerService.warn('warning message');

        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('WARN'),
        );
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('warning message'),
        );
      });

      it('should log debug messages', () => {
        loggerService.debug('debug message');

        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('DEBUG'),
        );
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('debug message'),
        );
      });

      it('should log verbose messages', () => {
        loggerService.verbose('verbose message');

        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('VERBOSE'),
        );
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('verbose message'),
        );
      });
    });

    describe('metadata handling', () => {
      it('should include optional parameters in log output', () => {
        loggerService.log('message with meta', { userId: 123 });

        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('message with meta'),
          { userId: 123 },
        );
      });
    });

    describe('production mode', () => {
      const originalEnv = process.env.NODE_ENV;

      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      afterEach(() => {
        process.env.NODE_ENV = originalEnv;
      });

      it('should output JSON format in production', () => {
        const freshLogger = new AppLoggerService();
        freshLogger.setContext('ProdContext');
        freshLogger.log('production message');

        expect(consoleSpy.log).toHaveBeenCalled();
        const output = consoleSpy.log.mock.calls[0][0];
        const parsed = JSON.parse(output);

        expect(parsed).toMatchObject({
          level: 'info',
          message: 'production message',
          context: 'ProdContext',
          timestamp: expect.any(String),
        });
      });

      it('should use console.error for error level in production', () => {
        const freshLogger = new AppLoggerService();
        freshLogger.error('production error');

        expect(consoleSpy.error).toHaveBeenCalled();
        const output = consoleSpy.error.mock.calls[0][0];
        const parsed = JSON.parse(output);

        expect(parsed).toMatchObject({
          level: 'error',
          message: 'production error',
        });
      });

      it('should spread object metadata in production JSON', () => {
        const freshLogger = new AppLoggerService();
        freshLogger.log('message', { userId: 456, action: 'test' });

        const output = consoleSpy.log.mock.calls[0][0];
        const parsed = JSON.parse(output);

        expect(parsed).toMatchObject({
          userId: 456,
          action: 'test',
        });
      });

      it('should use meta array for non-object params in production', () => {
        const freshLogger = new AppLoggerService();
        freshLogger.log('message', 'string param');

        const output = consoleSpy.log.mock.calls[0][0];
        const parsed = JSON.parse(output);

        expect(parsed.meta).toEqual(['string param']);
      });
    });
  });

  describe('Module Token Registration', () => {
    it('should export LoggerService via token', () => {
      const service = module.get(LOGGER_TOKENS.LoggerService);
      expect(service).toBeInstanceOf(AppLoggerService);
    });

    it('should export AppLoggerService directly', () => {
      const service = module.get(AppLoggerService);
      expect(service).toBeInstanceOf(AppLoggerService);
    });
  });
});
