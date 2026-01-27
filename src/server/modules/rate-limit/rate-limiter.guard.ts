import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import type { IRateLimitService } from './rate-limit.types';
import TOKENS from './tokens';

/**
 * Global guard for rate limiting.
 * Applied via APP_GUARD to all routes.
 *
 * Sets standard rate limit headers on all responses:
 * - X-RateLimit-Limit: Maximum requests per window
 * - X-RateLimit-Remaining: Requests remaining in current window
 * - X-RateLimit-Reset: Unix timestamp when window resets
 * - Retry-After: Seconds until window resets (only on 429)
 *
 * @see ADR-013: Rate Limiting and Advanced Visualization
 */
@Injectable()
export class RateLimiterGuard implements CanActivate {
  constructor(
    @Inject(TOKENS.IRateLimitService)
    private readonly rateLimitService: IRateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    // Extract request info
    const ip = this.getClientIp(request);
    const userId = request.user?.userId as number | undefined;
    const path = request.path as string;
    const method = request.method as string;

    // Check rate limit
    const result = await this.rateLimitService.checkLimit(
      ip,
      userId,
      path,
      method,
    );

    // Set rate limit headers (if a rule matched)
    if (result.rule) {
      response.setHeader('X-RateLimit-Limit', result.limit.toString());
      response.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      response.setHeader(
        'X-RateLimit-Reset',
        Math.ceil(result.resetAt / 1000).toString(),
      );
    }

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
      response.setHeader('Retry-After', retryAfterSeconds.toString());

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          retryAfter: retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * Extract client IP address from request.
   * Handles proxied requests (X-Forwarded-For header).
   */
  private getClientIp(request: {
    headers: Record<string, string | string[] | undefined>;
    ip?: string;
    connection?: { remoteAddress?: string };
  }): string {
    // Check X-Forwarded-For header (set by proxies/load balancers)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0];
      return ips.trim();
    }

    // Fall back to direct IP
    return request.ip ?? request.connection?.remoteAddress ?? 'unknown';
  }
}
