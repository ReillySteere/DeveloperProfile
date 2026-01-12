import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface IJwtStrategy {
  validate(payload: {
    sub: number;
    username: string;
  }): Promise<{ userId: number; username: string }>;
}
/**
 * JWT Strategy for Passport.js to handle JWT authentication.
 * This strategy extracts the JWT from the Authorization header and validates it.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    if (!process.env.JWT_AUTH_SECRET) {
      throw new Error('JWT_AUTH_SECRET is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_AUTH_SECRET,
    });
  }

  async validate(payload: { sub: number; username: string }) {
    // For demonstration, simply return the payload. In a real app, you might look up the user.
    return { userId: payload.sub, username: payload.username };
  }
}
