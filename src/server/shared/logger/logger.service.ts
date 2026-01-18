import { Injectable, LoggerService } from '@nestjs/common';

/**
 * Structured logging service that outputs JSON in production
 * and human-readable logs in development.
 *
 * @example
 * // Inject in a service or controller
 * constructor(private readonly logger: AppLoggerService) {
 *   this.logger.setContext('MyService');
 * }
 *
 * this.logger.log('User logged in', { userId: 123 });
 */
@Injectable()
export class AppLoggerService implements LoggerService {
  private context?: string;

  /**
   * Set the context (usually the class name) for log messages
   */
  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, ...optionalParams: unknown[]): void {
    this.printLog('info', message, optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    this.printLog('error', message, optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    this.printLog('warn', message, optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    this.printLog('debug', message, optionalParams);
  }

  verbose(message: string, ...optionalParams: unknown[]): void {
    this.printLog('verbose', message, optionalParams);
  }

  private printLog(level: string, message: string, params: unknown[]): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const timestamp = new Date().toISOString();

    if (isProduction) {
      // JSON format for production (parseable by log aggregators like ELK, Datadog)
      const logEntry: Record<string, unknown> = {
        timestamp,
        level,
        message,
      };

      if (this.context) {
        logEntry.context = this.context;
      }

      if (params.length > 0) {
        // If first param is an object, spread it; otherwise use meta array
        if (typeof params[0] === 'object' && params[0] !== null) {
          Object.assign(logEntry, params[0]);
        } else {
          logEntry.meta = params;
        }
      }

      // Use appropriate console method for level
      const consoleMethod = level === 'error' ? console.error : console.log;
      consoleMethod(JSON.stringify(logEntry));
    } else {
      // Human-readable for development
      const contextStr = this.context ? `[${this.context}] ` : '';
      const levelColor = this.getLevelColor(level);
      const levelStr = `${levelColor}${level.toUpperCase().padEnd(7)}${this.getResetColor()}`;

      if (params.length > 0) {
        console.log(
          `${timestamp} ${levelStr} ${contextStr}${message}`,
          ...params,
        );
      } else {
        console.log(`${timestamp} ${levelStr} ${contextStr}${message}`);
      }
    }
  }

  private getLevelColor(level: string): string {
    // ANSI color codes for terminal
    switch (level) {
      case 'error':
        return '\x1b[31m'; // Red
      case 'warn':
        return '\x1b[33m'; // Yellow
      case 'info':
        return '\x1b[32m'; // Green
      case 'debug':
        return '\x1b[36m'; // Cyan
      case 'verbose':
        return '\x1b[35m'; // Magenta
      default:
        return '';
    }
  }

  private getResetColor(): string {
    return '\x1b[0m';
  }
}
