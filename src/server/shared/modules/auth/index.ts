/**
 * Auth Module - Public API
 *
 * This barrel file defines the public interface of the auth shared module.
 * Only exports listed here may be imported by adapters.
 *
 * @example
 * // Allowed in adapters:
 * import { AuthModule, AUTH_TOKENS, AuthCredentialsDto } from 'server/shared/modules/auth';
 *
 * // NOT allowed (internal implementation):
 * import { AuthService } from 'server/shared/modules/auth/auth.service';
 */

// Module registration (for app.module.ts)
export { AuthModule } from './auth.module';

// Injection tokens (for DI wiring)
export { AUTH_TOKENS, type AuthTokens } from './tokens';

// ACL DTOs (input/output contracts)
export { AuthCredentialsDto, UserDto, TokenResponseDto } from './auth.dto';

// Type for the internal auth service interface (for adapter typing only)
export type { IAuthService } from './auth.service';
