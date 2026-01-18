/**
 * Business-layer types for logging.
 *
 * These types are owned by the business layer and represent the
 * application's view of logging concepts.
 */

/**
 * Context metadata for log entries.
 */
export interface LogContext {
  /** Service or component name */
  service?: string;
  /** Request identifier for tracing */
  requestId?: string;
  /** Additional arbitrary metadata */
  [key: string]: unknown;
}

/**
 * Log levels supported by the logging port.
 */
export type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

/**
 * Structured log entry for serialization.
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  meta?: LogContext;
}
