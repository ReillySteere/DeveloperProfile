import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthModule as SharedAuthModule } from 'server/shared/modules/auth';
import {
  AuthenticationAdapter,
  AUTH_ADAPTER_TOKENS,
} from 'server/shared/adapters/auth';

/**
 * Business Auth Module
 *
 * This module exposes authentication endpoints for the application.
 * It imports the shared AuthModule for core functionality and uses
 * the AuthenticationAdapter to access auth services.
 *
 * This separation allows the shared auth module to be extracted
 * to a standalone package while keeping application-specific
 * endpoints in the application codebase.
 */
@Module({
  imports: [SharedAuthModule],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_ADAPTER_TOKENS.Authentication,
      useClass: AuthenticationAdapter,
    },
  ],
})
export class AuthModule {}
