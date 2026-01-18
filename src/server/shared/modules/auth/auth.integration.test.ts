import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { IAuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';
import { AUTH_TOKENS } from './tokens';
import { ConflictException } from '@nestjs/common';

/**
 * Integration tests for the shared Auth module's internal implementation.
 *
 * These tests verify the internal workings of the auth module:
 * - AuthService behavior (register, validateUser, login)
 * - JwtStrategy token validation
 * - Module configuration (JWT_AUTH_SECRET requirement)
 *
 * Consumer-facing tests (via adapters) are in src/server/modules/auth/
 */
describe('Auth Module (Internal)', () => {
  let module: TestingModule;
  let authService: IAuthService;
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

    authService = module.get<IAuthService>(AUTH_TOKENS.AuthService);
    jwtStrategy = module.get<JwtStrategy>(AUTH_TOKENS.JwtStrategy);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await module.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthService', () => {
    describe('register', () => {
      it('should register a new user and return user entity', async () => {
        const result = await authService.register('testuser', 'password123');

        expect(result).toBeDefined();
        expect(result.username).toBe('testuser');
        expect(result.userId).toBeDefined();
        // Note: AuthService returns full User entity; password sanitization
        // happens at the controller/adapter layer
        expect(result.password).toBeDefined();
      });

      it('should throw ConflictException if username already exists', async () => {
        await authService.register('duplicate', 'password123');

        await expect(
          authService.register('duplicate', 'password123'),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('validateUser', () => {
      it('should return user data for valid credentials', async () => {
        const username = 'validuser';
        const password = 'password123';
        await authService.register(username, password);

        const result = await authService.validateUser(username, password);

        expect(result).toBeDefined();
        expect(result?.username).toBe(username);
        expect(result?.userId).toBeDefined();
      });

      it('should return null for non-existent user', async () => {
        const result = await authService.validateUser(
          'nonexistent',
          'password',
        );

        expect(result).toBeNull();
      });

      it('should return null for wrong password', async () => {
        const username = 'wrongpassuser';
        await authService.register(username, 'correctpassword');

        const result = await authService.validateUser(
          username,
          'wrongpassword',
        );

        expect(result).toBeNull();
      });
    });

    describe('login', () => {
      it('should return access token for validated user', () => {
        const user = { userId: 1, username: 'loginuser' };

        const result = authService.login(user);

        expect(result).toEqual({ access_token: 'mock-token' });
        expect(jwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({
            username: user.username,
            sub: user.userId,
          }),
        );
      });
    });
  });

  describe('JwtStrategy', () => {
    it('should validate and return user payload from JWT', async () => {
      const payload = { sub: 1, username: 'jwtuser' };

      const result = await jwtStrategy.validate(payload);

      expect(result).toEqual({
        userId: 1,
        username: 'jwtuser',
      });
    });
  });

  describe('Module Configuration', () => {
    const originalSecret = process.env.JWT_AUTH_SECRET;

    afterAll(() => {
      process.env.JWT_AUTH_SECRET = originalSecret;
    });

    it('should throw error if JWT_AUTH_SECRET is not defined', async () => {
      delete process.env.JWT_AUTH_SECRET;

      await expect(
        Test.createTestingModule({
          imports: [
            TypeOrmModule.forRoot({
              type: 'better-sqlite3',
              database: ':memory:',
              entities: [User],
              synchronize: true,
            }),
            AuthModule,
          ],
        }).compile(),
      ).rejects.toThrow('JWT_AUTH_SECRET is not defined');
    });
  });
});
