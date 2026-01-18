/**
 * Shared Adapters - Bridge layer between business modules and shared infrastructure
 *
 * Adapters translate between business-layer types and shared module internals.
 * Business modules should import from adapters, never from shared modules directly.
 *
 * @example
 * // In a business module:
 * import { AuthenticationAdapter, AUTH_ADAPTER_TOKENS } from 'server/shared/adapters';
 * import { LoggingAdapter, LOGGER_ADAPTER_TOKENS } from 'server/shared/adapters';
 */

// Auth adapter exports
export {
  AuthenticationAdapter,
  AuthGuardAdapter,
  AUTH_ADAPTER_TOKENS,
  AUTH_TOKENS,
  type AuthenticatedUser,
  type TokenResult,
  type AccountCreationResult,
  type AuthCredentials,
} from './auth';

// Logger adapter exports
export {
  LoggingAdapter,
  LOGGER_ADAPTER_TOKENS,
  LOGGER_TOKENS,
  type LogContext,
  type LogLevel,
  type LogEntry,
} from './logger';
