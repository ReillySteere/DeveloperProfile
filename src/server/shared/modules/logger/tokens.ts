/**
 * Injection tokens for the Logger module.
 *
 * These tokens are exported as part of the module's public API
 * to facilitate dependency injection in adapters and consuming modules.
 */
export const LOGGER_TOKENS = {
  LoggerService: Symbol('LoggerService'),
} as const;

export type LoggerTokens = typeof LOGGER_TOKENS;
