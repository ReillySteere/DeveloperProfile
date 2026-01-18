/**
 * Port interface for logging operations.
 *
 * This defines the contract that the logging adapter must implement.
 * Business modules should depend on this interface, not the concrete implementation.
 */
export interface ILoggingPort {
  /**
   * Sets the context for subsequent log messages.
   * @param context - The context identifier (usually the class name)
   */
  setContext(context: string): void;

  /**
   * Logs an informational message.
   * @param message - The message to log
   * @param meta - Optional metadata to include
   */
  log(message: string, meta?: LogContext): void;

  /**
   * Logs an error message.
   * @param message - The error message to log
   * @param meta - Optional metadata to include
   */
  error(message: string, meta?: LogContext): void;

  /**
   * Logs a warning message.
   * @param message - The warning message to log
   * @param meta - Optional metadata to include
   */
  warn(message: string, meta?: LogContext): void;

  /**
   * Logs a debug message.
   * @param message - The debug message to log
   * @param meta - Optional metadata to include
   */
  debug(message: string, meta?: LogContext): void;

  /**
   * Logs a verbose message.
   * @param message - The verbose message to log
   * @param meta - Optional metadata to include
   */
  verbose(message: string, meta?: LogContext): void;
}

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
