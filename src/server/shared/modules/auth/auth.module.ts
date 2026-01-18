import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { User } from './user.entity';
import { AUTH_TOKENS } from './tokens';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Shared Auth Module
 *
 * This module provides core authentication functionality including:
 * - User validation and password hashing
 * - JWT token generation and verification
 * - Authentication guards
 *
 * This is a shared module following hexagonal architecture.
 * Business modules should consume this via adapters, not directly.
 *
 * Note: The AuthController has been extracted to src/server/modules/auth/
 * as it contains application-specific endpoints.
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        if (!process.env.JWT_AUTH_SECRET) {
          throw new Error('JWT_AUTH_SECRET is not defined');
        }
        return {
          secret: process.env.JWT_AUTH_SECRET,
          signOptions: { expiresIn: '1h' },
        };
      },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [
    {
      provide: AUTH_TOKENS.AuthService,
      useClass: AuthService,
    },
    {
      provide: AUTH_TOKENS.JwtAuthGuard,
      useClass: JwtAuthGuard,
    },
    {
      provide: AUTH_TOKENS.JwtStrategy,
      useClass: JwtStrategy,
    },
  ],
  exports: [AUTH_TOKENS.AuthService, AUTH_TOKENS.JwtAuthGuard],
})
export class AuthModule {}
