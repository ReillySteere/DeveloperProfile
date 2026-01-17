import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';
import TOKENS from './tokens';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

describe('Auth Integration', () => {
  let module: TestingModule;
  let authController: AuthController;
  let jwtStrategy: JwtStrategy;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  beforeAll(async () => {
    process.env.JWT_AUTH_SECRET = 'test-secret';

    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [User],
          synchronize: true,
        }),
        AuthModule,
      ],
    })
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .compile();

    authController = module.get<AuthController>(AuthController);
    jwtStrategy = module.get<JwtStrategy>(TOKENS.JwtStrategy);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await module.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthController', () => {
    describe('register', () => {
      it('should register a new user', async () => {
        const registerDto = { username: 'newuser', password: 'password123' };
        const result = await authController.register(registerDto);

        expect(result).toBeDefined();
        expect(result.username).toBe('newuser');
        expect(result.password).not.toBe('password123'); // Should be hashed
      });

      it('should throw ConflictException if username already exists', async () => {
        const registerDto = { username: 'existing', password: 'password123' };
        await authController.register(registerDto);

        await expect(authController.register(registerDto)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('login', () => {
      it('should return access token for valid credentials', async () => {
        // Create user first
        const username = 'loginuser';
        const password = 'password123';
        await authController.register({ username, password });

        const loginDto = { username, password };
        const result = await authController.login(loginDto);

        expect(result).toEqual({ access_token: 'mock-token' });
        expect(jwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            username,
          }),
        );
      });

      it('should throw UnauthorizedException for invalid credentials', async () => {
        const loginDto = {
          username: 'nonexistent',
          password: 'wrong-password',
        };

        await expect(authController.login(loginDto)).rejects.toThrow(
          UnauthorizedException,
        );
        expect(jwtService.sign).not.toHaveBeenCalled();
      });
    });
  });

  describe('JwtStrategy', () => {
    it('should validate and return user payload', async () => {
      const payload = { sub: 1, username: 'demo' };
      const result = await jwtStrategy.validate(payload);

      expect(result).toEqual({
        userId: 1,
        username: 'demo',
      });
    });
  });
});
