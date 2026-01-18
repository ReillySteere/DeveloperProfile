import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Only import from public module API and adapters - no internal visibility
import { AuthModule } from '../../shared/modules/auth';
import {
  AuthenticationAdapter,
  AuthGuardAdapter,
  AUTH_ADAPTER_TOKENS,
  AuthenticatedUser,
  TokenResult,
  AccountCreationResult,
  AuthCredentials,
} from '../../shared/adapters/auth';
import { IAuthenticationPort, IAuthGuardPort } from '../../shared/ports';
import { AuthController } from './auth.controller';
import { AuthModule as BusinessAuthModule } from './auth.module';

/**
 * Integration tests for Auth functionality as consumed by business modules.
 *
 * These tests verify the adapter-based interface that consumers use:
 * - AuthController endpoints (register, login)
 * - AuthenticationAdapter port implementation
 *
 * NO visibility into internal module implementation details (JwtStrategy, AuthService internals).
 * Internal module tests are in src/server/shared/modules/auth/
 */
describe('Auth Module (Consumer API)', () => {
  let module: TestingModule;
  let authController: AuthController;
  let authAdapter: IAuthenticationPort;
  let authGuardAdapter: IAuthGuardPort;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  beforeAll(async () => {
    process.env.JWT_AUTH_SECRET = 'test-secret';

    // Dynamically import User entity to get TypeORM working
    // This is acceptable in tests - we need the entity for the in-memory DB
    const { User } = await import('../../shared/modules/auth/user.entity');

    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [User],
          synchronize: true,
        }),
        AuthModule,
        BusinessAuthModule,
      ],
      providers: [
        {
          provide: AUTH_ADAPTER_TOKENS.Authentication,
          useClass: AuthenticationAdapter,
        },
        {
          provide: AUTH_ADAPTER_TOKENS.AuthGuard,
          useClass: AuthGuardAdapter,
        },
      ],
    })
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .compile();

    authController = module.get<AuthController>(AuthController);
    authAdapter = module.get<IAuthenticationPort>(
      AUTH_ADAPTER_TOKENS.Authentication,
    );
    authGuardAdapter = module.get<IAuthGuardPort>(
      AUTH_ADAPTER_TOKENS.AuthGuard,
    );
  });

  afterAll(async () => {
    await module.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthController (Business Layer)', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user and return sanitized response', async () => {
        const registerDto = { username: 'newuser', password: 'password123' };

        const result = await authController.register(registerDto);

        expect(result).toBeDefined();
        expect(result.username).toBe('newuser');
        expect(result.userId).toBeDefined();
        // Password must never be exposed
        expect((result as { password?: string }).password).toBeUndefined();
      });

      it('should reject duplicate username with ConflictException', async () => {
        const registerDto = { username: 'existing', password: 'password123' };
        await authController.register(registerDto);

        await expect(authController.register(registerDto)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('POST /api/auth/login', () => {
      it('should return access token for valid credentials', async () => {
        const username = 'loginuser';
        const password = 'password123';
        await authController.register({ username, password });

        const result = await authController.login({ username, password });

        expect(result).toEqual({ access_token: 'mock-token' });
      });

      it('should reject invalid credentials with UnauthorizedException', async () => {
        const loginDto = {
          username: 'nonexistent',
          password: 'wrong-password',
        };

        await expect(authController.login(loginDto)).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });
  });

  describe('AuthenticationAdapter (Port Interface)', () => {
    describe('createAccount', () => {
      it('should create account and return result matching port interface', async () => {
        const result = await authAdapter.createAccount(
          'adapteruser',
          'password123',
        );

        expect(result).toMatchObject({
          userId: expect.any(Number),
          username: 'adapteruser',
        });
      });
    });

    describe('validateCredentials', () => {
      it('should return authenticated user for valid credentials', async () => {
        const username = 'validateuser';
        const password = 'password123';
        await authAdapter.createAccount(username, password);

        const result = await authAdapter.validateCredentials(
          username,
          password,
        );

        expect(result).toMatchObject({
          userId: expect.any(Number),
          username,
        });
      });

      it('should return null for invalid credentials', async () => {
        const result = await authAdapter.validateCredentials(
          'nobody',
          'wrongpass',
        );

        expect(result).toBeNull();
      });
    });

    describe('generateToken', () => {
      it('should generate token result matching port interface', async () => {
        const user = { userId: 99, username: 'tokenuser' };

        const result = authAdapter.generateToken(user);

        expect(result).toMatchObject({
          accessToken: expect.any(String),
        });
      });
    });
  });

  describe('AuthGuardAdapter (Port Interface)', () => {
    describe('canActivate', () => {
      it('should expose canActivate method from port interface', () => {
        // Verify the adapter implements the port interface correctly
        expect(authGuardAdapter.canActivate).toBeDefined();
        expect(typeof authGuardAdapter.canActivate).toBe('function');
      });
    });
  });

  describe('Type Exports', () => {
    it('should export AuthenticatedUser type matching port requirements', () => {
      const user: AuthenticatedUser = {
        userId: 1,
        username: 'testuser',
      };

      expect(user.userId).toBe(1);
      expect(user.username).toBe('testuser');
    });

    it('should export TokenResult type for token responses', () => {
      const token: TokenResult = {
        accessToken: 'jwt-token-value',
      };

      expect(token.accessToken).toBe('jwt-token-value');
    });

    it('should export AccountCreationResult type for registration', () => {
      const result: AccountCreationResult = {
        userId: 42,
        username: 'newaccount',
      };

      expect(result.userId).toBe(42);
      expect(result.username).toBe('newaccount');
    });

    it('should export AuthCredentials type for login requests', () => {
      const credentials: AuthCredentials = {
        username: 'user',
        password: 'pass',
      };

      expect(credentials.username).toBe('user');
      expect(credentials.password).toBe('pass');
    });

    it('should export IAuthGuardPort interface for guard implementations', () => {
      // IAuthGuardPort is available for typing guard adapters
      const guardCheck = (guard: IAuthGuardPort) => {
        expect(guard.canActivate).toBeDefined();
      };

      // We can verify the type exists and has the right shape
      expect(guardCheck).toBeDefined();
    });
  });
});
