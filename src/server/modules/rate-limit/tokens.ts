/**
 * Dependency injection tokens for the RateLimit module.
 */
const RATE_LIMIT_TOKENS = {
  IRateLimitRepository: Symbol('IRateLimitRepository'),
  IRateLimitService: Symbol('IRateLimitService'),
} as const;

export default RATE_LIMIT_TOKENS;
