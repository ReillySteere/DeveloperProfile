/**
 * Auth Adapter - Public API
 *
 * This barrel file exports the authentication adapter and related types.
 * Business modules should import from here, not from the auth shared module directly.
 *
 * @example
 * import {
 *   AuthenticationAdapter,
 *   AuthGuardAdapter,
 *   AUTH_ADAPTER_TOKENS,
 *   type AuthenticatedUser,
 * } from 'server/shared/adapters/auth';
 */

// Adapters
export {
  AuthenticationAdapter,
  AuthGuardAdapter,
  AUTH_ADAPTER_TOKENS,
} from './auth.adapter';

// Business-layer types
export {
  AuthenticatedUser,
  TokenResult,
  AccountCreationResult,
  AuthCredentials,
} from './auth.types';

// Re-export module tokens for DI convenience
// (adapters need these for injection)
export { AUTH_TOKENS } from '../../modules/auth';
