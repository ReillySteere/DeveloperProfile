import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ApiBody, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IAuthenticationPort } from 'server/shared/ports';
import {
  AuthCredentialsDto,
  UserDto,
  TokenResponseDto,
} from 'server/shared/modules/auth';
import { AUTH_ADAPTER_TOKENS } from 'server/shared/adapters/auth';

/**
 * Authentication controller for the application.
 *
 * This controller exposes authentication endpoints (login, register) for the application.
 * It consumes the authentication adapter rather than the auth shared module directly,
 * following the hexagonal architecture pattern.
 */
@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    @Inject(AUTH_ADAPTER_TOKENS.Authentication)
    private readonly auth: IAuthenticationPort,
  ) {}

  @Post('login')
  @ApiBody({ type: AuthCredentialsDto })
  @ApiOperation({ summary: 'Login and retrieve JWT token' })
  @ApiResponse({
    status: 201,
    description: 'User logged in successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: AuthCredentialsDto) {
    const user = await this.auth.validateCredentials(
      loginDto.username,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.auth.generateToken(user);

    // Map to API response format
    return { access_token: token.accessToken };
  }

  @Post('register')
  @ApiBody({ type: AuthCredentialsDto })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: UserDto,
  })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  async register(@Body() registerDto: AuthCredentialsDto) {
    const result = await this.auth.createAccount(
      registerDto.username,
      registerDto.password,
    );

    // Map to API response format
    return {
      userId: result.userId,
      username: result.username,
    };
  }
}
