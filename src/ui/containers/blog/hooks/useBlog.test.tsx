import { renderHook, AllTheProviders } from 'ui/test-utils';
import { useCreateBlogPost, useUpdateBlogPost } from './useBlog';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
}));

// NOTE: These tests focus on the hooks' behavior regarding authentication token presence - they are
// separate from the container tests because this state requires the token to expire while the components
// are already mounted / rendered, which is tricky to simulate in container tests.
describe('useBlog Hooks', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, isAuthenticated: false });
    jest.clearAllMocks();
  });

  describe('useUpdateBlogPost', () => {
    it('throws error if no token is available', async () => {
      const { result } = renderHook(() => useUpdateBlogPost(), {
        wrapper: AllTheProviders,
      });

      // Try to mutate without a token
      expect(useAuthStore.getState().token).toBeNull();

      await expect(
        result.current.mutateAsync({
          id: '1',
          data: { title: 'Test' },
        }),
      ).rejects.toThrow('No authentication token found');
    });
  });

  describe('useCreateBlogPost', () => {
    it('throws error if no token is available', async () => {
      const { result } = renderHook(() => useCreateBlogPost(), {
        wrapper: AllTheProviders,
      });

      // Try to mutate without a token
      expect(useAuthStore.getState().token).toBeNull();

      await expect(
        result.current.mutateAsync({ title: 'Test' }),
      ).rejects.toThrow('No authentication token found');
    });
  });
});
