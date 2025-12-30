import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(() => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
    } as unknown as AuthService;
    authController = new AuthController(authService);
  });

  describe('login', () => {
    it('should return invalid credentials when user validation fails', () => {
      (authService.validateUser as jest.Mock).mockReturnValue(null);
      const loginDto = { username: 'invalid', password: 'wrong' };
      const result = authController.login(loginDto);
      expect(authService.validateUser).toHaveBeenCalledWith('invalid', 'wrong');
      expect(result).toEqual({ message: 'Invalid credentials' });
    });

    it('should return a token when credentials are valid', () => {
      const validUser = { id: 1, username: 'testUser' };
      const tokenResponse = { token: 'jwt-token' };
      (authService.validateUser as jest.Mock).mockReturnValue(validUser);
      (authService.login as jest.Mock).mockReturnValue(tokenResponse);
      const loginDto = { username: 'testUser', password: 'pass123' };
      const result = authController.login(loginDto);
      expect(authService.validateUser).toHaveBeenCalledWith(
        'testUser',
        'pass123',
      );
      expect(authService.login).toHaveBeenCalledWith(validUser);
      expect(result).toEqual(tokenResponse);
    });
  });

  describe('getProtectedData', () => {
    it('should return protected data message', () => {
      const result = authController.getProtectedData();
      expect(result).toEqual({
        message: 'JWT is valid. You have accessed protected data.',
      });
    });
  });
});
