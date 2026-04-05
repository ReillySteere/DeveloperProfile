import { Injectable, LoggerService } from '@nestjs/common';

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

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

  private printLog(level: LogLevel, message: string, params: unknown[]): void {
    const timestamp = new Date().toISOString();

    if (process.env.NODE_ENV === 'production') {
      this.printJsonLog(level, message, params, timestamp);
    } else {
      this.printDevLog(level, message, params, timestamp);
    }
  }

  private printJsonLog(
    level: LogLevel,
    message: string,
    params: unknown[],
    timestamp: string,
  ): void {
    const logEntry: Record<string, unknown> = {
      timestamp,
      level,
      message,
      ...(this.context ? { context: this.context } : {}),
      ...this.formatParams(params),
    };

    const consoleMethod = level === 'error' ? console.error : console.log;
    consoleMethod(JSON.stringify(logEntry));
  }

  private printDevLog(
    level: LogLevel,
    message: string,
    params: unknown[],
    timestamp: string,
  ): void {
    const contextStr = this.context ? `[${this.context}] ` : '';
    const levelColor = this.getLevelColor(level);
    const levelStr = `${levelColor}${level.toUpperCase().padEnd(7)}${this.getResetColor()}`;
    const prefix = `${timestamp} ${levelStr} ${contextStr}${message}`;

    if (params.length > 0) {
      console.log(prefix, ...params);
    } else {
      console.log(prefix);
    }
  }

  private formatParams(params: unknown[]): Record<string, unknown> {
    if (params.length === 0) return {};
    if (typeof params[0] === 'object' && params[0] !== null) {
      return params[0] as Record<string, unknown>;
    }
    return { meta: params };
  }

  private getLevelColor(level: LogLevel): string {
    // ANSI color codes for terminal
    const colors: Record<LogLevel, string> = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m', // Yellow
      info: '\x1b[32m', // Green
      debug: '\x1b[36m', // Cyan
      verbose: '\x1b[35m', // Magenta
    };
    return colors[level];
  }

  private getResetColor(): string {
    return '\x1b[0m';
  }
}
