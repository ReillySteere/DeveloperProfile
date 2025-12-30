import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
    } as unknown as JwtService;
    authService = new AuthService(jwtService);
  });

  describe('validateUser', () => {
    it('should return user information without password when credentials are valid', () => {
      const result = authService.validateUser('demo', 'password');
      expect(result).toEqual({ userId: 1, username: 'demo' });
    });

    it('should return null when credentials are invalid', () => {
      const result = authService.validateUser('demo', 'wrong-password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an access token for a valid user', () => {
      const user = { userId: 1, username: 'demo' };
      const result = authService.login(user);
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: 'demo',
        sub: 1,
      });
      expect(result).toEqual({ access_token: 'mock-token' });
    });
  });
});
