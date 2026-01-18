/* istanbul ignore file -- barrel file for module public API */
/**
 * Logger Module - Public API
 *
 * This barrel file defines the public interface of the logger shared module.
 * Only exports listed here may be imported by adapters.
 *
 * @example
 * // Allowed in adapters:
 * import { LoggerModule, LOGGER_TOKENS } from 'server/shared/modules/logger';
 *
 * // NOT allowed (internal implementation):
 * import { AppLoggerService } from 'server/shared/modules/logger/logger.service';
 */

// Module registration (for app.module.ts)
export { LoggerModule } from './logger.module';

// Injection tokens (for DI wiring)
export { LOGGER_TOKENS, type LoggerTokens } from './tokens';

// Service export for backward compatibility during migration
// TODO: Remove after migration - use adapter instead
export { AppLoggerService } from './logger.service';
