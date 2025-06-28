import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_AUTH_SECRET || 'defaultSecretKey',
    });
  }

  async validate(payload: any) {
    // For demonstration, simply return the payload. In a real app, you might look up the user.
    return { userId: payload.sub, username: payload.username };
  }
}
