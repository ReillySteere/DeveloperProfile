import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  // TODO: Handle with database user
  private readonly demoUser = {
    userId: 1,
    username: 'demo',
    password: 'password',
  };

  constructor(private readonly jwtService: JwtService) {}

  validateUser(username: string, password: string): any {
    if (username === this.demoUser.username && password === 'password') {
      const { password, ...result } = this.demoUser;
      return result;
    }
    return null;
  }

  // Generate a JWT token for a valid user
  login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
