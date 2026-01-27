/* istanbul ignore file -- barrel file with type re-exports */
/**
 * Logger Adapter - Public API
 *
 * This barrel file exports the logging adapter and related types.
 * Business modules should import from here, not from the logger shared module directly.
 *
 * @example
 * import {
 *   LoggingAdapter,
 *   LOGGER_ADAPTER_TOKENS,
 *   type LogContext,
 * } from 'server/shared/adapters/logger';
 */

// Adapters
export { LoggingAdapter, LOGGER_ADAPTER_TOKENS } from './logger.adapter';

// Business-layer types
export { LogContext, LogLevel, LogEntry } from './logger.types';

// Re-export module tokens for DI convenience
export { LOGGER_TOKENS } from '../../modules/logger';

// Re-export LoggerService type for type annotations
export type { LoggerService } from '@nestjs/common';
