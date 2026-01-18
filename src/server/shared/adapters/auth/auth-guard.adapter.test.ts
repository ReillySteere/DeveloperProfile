import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CanActivate } from '@nestjs/common';
import { AuthGuardAdapter } from './auth.adapter';
import { AUTH_TOKENS } from '../../modules/auth';

/**
 * Unit tests for AuthGuardAdapter.
 *
 * Tests the adapter's delegation to the underlying JWT guard.
 */
describe('AuthGuardAdapter', () => {
  let adapter: AuthGuardAdapter;
  let mockJwtAuthGuard: jest.Mocked<CanActivate>;

  beforeEach(async () => {
    mockJwtAuthGuard = {
      canActivate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuardAdapter,
        {
          provide: AUTH_TOKENS.JwtAuthGuard,
          useValue: mockJwtAuthGuard,
        },
      ],
    }).compile();

    adapter = module.get<AuthGuardAdapter>(AuthGuardAdapter);
  });

  describe('canActivate', () => {
    it('should delegate to underlying JWT guard and return true', () => {
      const mockContext = createMockExecutionContext();
      mockJwtAuthGuard.canActivate.mockReturnValue(true);

      const result = adapter.canActivate(mockContext);

      expect(mockJwtAuthGuard.canActivate).toHaveBeenCalledWith(mockContext);
      expect(result).toBe(true);
    });

    it('should delegate to underlying JWT guard and return false', () => {
      const mockContext = createMockExecutionContext();
      mockJwtAuthGuard.canActivate.mockReturnValue(false);

      const result = adapter.canActivate(mockContext);

      expect(mockJwtAuthGuard.canActivate).toHaveBeenCalledWith(mockContext);
      expect(result).toBe(false);
    });

    it('should handle async guard responses', async () => {
      const mockContext = createMockExecutionContext();
      mockJwtAuthGuard.canActivate.mockResolvedValue(true);

      const result = await adapter.canActivate(mockContext);

      expect(mockJwtAuthGuard.canActivate).toHaveBeenCalledWith(mockContext);
      expect(result).toBe(true);
    });

    it('should propagate guard rejection', async () => {
      const mockContext = createMockExecutionContext();
      mockJwtAuthGuard.canActivate.mockRejectedValue(new Error('Unauthorized'));

      await expect(adapter.canActivate(mockContext)).rejects.toThrow(
        'Unauthorized',
      );
    });
  });
});

function createMockExecutionContext(): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: {} }),
      getResponse: () => ({}),
      getNext: () => jest.fn(),
    }),
    switchToRpc: () => ({
      getData: () => ({}),
      getContext: () => ({}),
    }),
    switchToWs: () => ({
      getData: () => ({}),
      getClient: () => ({}),
    }),
    getType: () => 'http',
    getClass: () => class {},
    getHandler: () => () => {},
    getArgs: () => [],
    getArgByIndex: () => ({}),
  } as unknown as ExecutionContext;
}
