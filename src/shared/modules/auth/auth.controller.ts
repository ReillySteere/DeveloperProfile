import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ApiBody, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { type IAuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthCredentialsDto } from './auth.dto';
import TOKENS from './tokens';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  readonly #authService: IAuthService;

  constructor(@Inject(TOKENS.AuthService) authService: IAuthService) {
    this.#authService = authService;
  }

  // Public endpoint: simulates a login and returns a JWT token
  @Post('login')
  @ApiBody({ type: AuthCredentialsDto })
  @ApiOperation({ summary: 'Login and retrieve JWT token' })
  @ApiResponse({ status: 201, description: 'User logged in successfully' })
  async login(@Body() loginDto: AuthCredentialsDto) {
    const user = await this.#authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.#authService.login(user);
  }

  @Post('register')
  @ApiBody({ type: AuthCredentialsDto })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() registerDto: AuthCredentialsDto) {
    return this.#authService.register(
      registerDto.username,
      registerDto.password,
    );
  }

  // Protected test endpoint that requires JWT authentication
  @UseGuards(JwtAuthGuard)
  @Get('protected')
  @ApiOperation({
    summary: 'Protected endpoint accessible only with a valid JWT',
  })
  @ApiResponse({ status: 200, description: 'Access granted', type: Object })
  getProtectedData() {
    return { message: 'JWT is valid. You have accessed protected data.' };
  }
}
