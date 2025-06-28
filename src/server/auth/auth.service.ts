import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type User = {
  userId: number;
  username: string;
  password: string;
};

@Injectable()
export class AuthService {
  // TODO: Handle with database user
  private readonly demoUser: User = {
    userId: 1,
    username: 'demo',
    password: 'password',
  };

  constructor(private readonly jwtService: JwtService) {}

  validateUser(username: string, password: string): Partial<User> | null {
    if (username === this.demoUser.username && password === 'password') {
      const { password: _password, ...result } = this.demoUser;
      return result;
    }
    return null;
  }

  // Generate a JWT token for a valid user
  login(user: Partial<User>): { access_token: string } {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
