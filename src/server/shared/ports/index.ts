/**
 * Shared Ports - Contract interfaces for shared modules
 *
 * Ports define the boundaries between business modules and shared infrastructure.
 * Business modules should depend on these interfaces, with adapters providing
 * the concrete implementations.
 */

/* istanbul ignore file -- type-only exports for TypeScript, no runtime code */

export {
  IAuthenticationPort,
  IAuthGuardPort,
  AuthenticatedUser,
  TokenResult,
  AccountCreationResult,
} from './auth.port';

export { ILoggingPort, LogContext } from './logger.port';

export {
  ITraceServicePort,
  CreateTraceInput,
  PhaseTiming,
  IRequestTrace,
  TRACE_SERVICE_TOKEN,
} from './trace.port';
