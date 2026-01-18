/**
 * Injection tokens for the Auth module.
 *
 * These tokens are exported as part of the module's public API
 * to facilitate dependency injection in adapters and consuming modules.
 */
export const AUTH_TOKENS = {
  AuthService: Symbol('AuthService'),
  JwtAuthGuard: Symbol('JwtAuthGuard'),
  JwtStrategy: Symbol('JwtStrategy'),
} as const;

export type AuthTokens = typeof AUTH_TOKENS;
