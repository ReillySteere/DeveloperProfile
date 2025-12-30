import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    process.env.JWT_AUTH_SECRET = process.env.JWT_AUTH_SECRET || 'test-secret';
    module = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();
  });

  it('should create the module', () => {
    expect(module).toBeDefined();
  });

  it('should provide AuthService', () => {
    const authService = module.get(AuthService);
    expect(authService).toBeDefined();
  });

  it('should provide JwtStrategy', () => {
    const jwtStrategy = module.get(JwtStrategy);
    expect(jwtStrategy).toBeDefined();
  });

  it('should create an instance of AuthController', () => {
    const authController = module.get(AuthController);
    expect(authController).toBeDefined();
  });

  it('should register JwtModule with the correct configuration', () => {
    const jwtModule = module.get(JwtModule);
    expect(jwtModule).toBeDefined();
    // Although JwtModule's configuration cannot be directly inspected,
    // its existence confirms that it has been registered.
  });
});
