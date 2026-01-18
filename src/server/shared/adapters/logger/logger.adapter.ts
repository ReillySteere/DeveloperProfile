import { Injectable, Inject } from '@nestjs/common';
import { ILoggingPort, LogContext } from '../../ports';
import { LOGGER_TOKENS } from '../../modules/logger';
import { LoggerService } from '@nestjs/common';

/**
 * Adapter tokens for DI registration in business modules.
 */
export const LOGGER_ADAPTER_TOKENS = {
  Logger: Symbol('LoggingAdapter'),
} as const;

/**
 * Adapter that bridges business modules to the logger shared module.
 *
 * This adapter implements the logging port interface and provides
 * a consistent logging interface for business modules.
 *
 * @example
 * // In a business module:
 * @Module({
 *   providers: [{
 *     provide: LOGGER_ADAPTER_TOKENS.Logger,
 *     useClass: LoggingAdapter,
 *   }],
 * })
 */
@Injectable()
export class LoggingAdapter implements ILoggingPort {
  private context?: string;

  constructor(
    @Inject(LOGGER_TOKENS.LoggerService)
    private readonly logger: LoggerService & {
      setContext?(context: string): void;
    },
  ) {}

  setContext(context: string): void {
    this.context = context;
    if (this.logger.setContext) {
      this.logger.setContext(context);
    }
  }

  log(message: string, meta?: LogContext): void {
    this.logger.log(message, this.formatMeta(meta));
  }

  error(message: string, meta?: LogContext): void {
    this.logger.error(message, this.formatMeta(meta));
  }

  warn(message: string, meta?: LogContext): void {
    this.logger.warn(message, this.formatMeta(meta));
  }

  debug(message: string, meta?: LogContext): void {
    if (this.logger.debug) {
      this.logger.debug(message, this.formatMeta(meta));
    }
  }

  verbose(message: string, meta?: LogContext): void {
    if (this.logger.verbose) {
      this.logger.verbose(message, this.formatMeta(meta));
    }
  }

  private formatMeta(meta?: LogContext): string | undefined {
    if (!meta) return this.context;
    return JSON.stringify({ context: this.context, ...meta });
  }
}
