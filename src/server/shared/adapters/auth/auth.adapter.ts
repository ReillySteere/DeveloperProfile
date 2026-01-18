import {
  Injectable,
  Inject,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import {
  IAuthenticationPort,
  IAuthGuardPort,
  AuthenticatedUser,
  TokenResult,
  AccountCreationResult,
} from '../../ports';
import { AUTH_TOKENS, type IAuthService } from '../../modules/auth';

/**
 * Adapter tokens for DI registration in business modules.
 */
export const AUTH_ADAPTER_TOKENS = {
  Authentication: Symbol('AuthenticationAdapter'),
  AuthGuard: Symbol('AuthGuardAdapter'),
} as const;

/**
 * Adapter that bridges business modules to the auth shared module.
 *
 * This adapter implements the authentication port interface and translates
 * between business-layer types and the auth module's internal types.
 *
 * @example
 * // In a business module:
 * @Module({
 *   imports: [AuthModule],
 *   providers: [{
 *     provide: AUTH_ADAPTER_TOKENS.Authentication,
 *     useClass: AuthenticationAdapter,
 *   }],
 * })
 */
@Injectable()
export class AuthenticationAdapter implements IAuthenticationPort {
  constructor(
    @Inject(AUTH_TOKENS.AuthService)
    private readonly authService: IAuthService,
  ) {}

  async validateCredentials(
    username: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const result = await this.authService.validateUser(username, password);
    if (!result) return null;

    return {
      userId: result.userId as number,
      username: result.username as string,
    };
  }

  generateToken(user: AuthenticatedUser): TokenResult {
    const result = this.authService.login({
      userId: user.userId,
      username: user.username,
    });

    return {
      accessToken: result.access_token,
    };
  }

  async createAccount(
    username: string,
    password: string,
  ): Promise<AccountCreationResult> {
    const user = await this.authService.register(username, password);

    return {
      userId: user.userId,
      username: user.username,
    };
  }
}

/**
 * Adapter that wraps the JWT auth guard for use in business modules.
 *
 * This allows business modules to use authentication guards without
 * directly depending on the auth module's internal implementation.
 *
 * @example
 * // In a controller:
 * @UseGuards(AuthGuardAdapter)
 * @Post()
 * create(@Body() dto: CreateDto) { ... }
 */
@Injectable()
export class AuthGuardAdapter implements CanActivate, IAuthGuardPort {
  constructor(
    @Inject(AUTH_TOKENS.JwtAuthGuard)
    private readonly jwtAuthGuard: CanActivate,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | import('rxjs').Observable<boolean> {
    return this.jwtAuthGuard.canActivate(context);
  }
}
