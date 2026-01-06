import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { User } from './user.entity';
import TOKENS from './tokens';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_AUTH_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [
    {
      provide: TOKENS.AuthService,
      useClass: AuthService,
    },
    {
      provide: TOKENS.JwtAuthGuard,
      useClass: JwtAuthGuard,
    },
    {
      provide: TOKENS.JwtStrategy,
      useClass: JwtStrategy,
    },
  ],
  controllers: [AuthController],
  exports: [TOKENS.AuthService, TOKENS.JwtAuthGuard],
})
export class AuthModule {}
