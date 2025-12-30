import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Public endpoint: simulates a login and returns a JWT token
  @Post('login')
  @ApiOperation({ summary: 'Login and retrieve JWT token' })
  @ApiResponse({ status: 201, description: 'User logged in successfully' })
  login(@Body() loginDto: { username: string; password: string }) {
    const user = this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      return { message: 'Invalid credentials' };
    }
    return this.authService.login(user);
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
