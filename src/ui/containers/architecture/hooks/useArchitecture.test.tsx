import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDependencyGraph } from './useArchitecture';
import { http, HttpResponse } from 'msw';
import { server } from 'ui/test-utils/msw';

// Wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDependencyGraph', () => {
  describe('enabled parameter', () => {
    it('should use default enabled=true when not provided', async () => {
      // Setup mock response
      server.use(
        http.get('/api/architecture/dependencies/:scope/:target', () => {
          return HttpResponse.json({
            name: 'blog',
            label: 'Blog',
            nodes: [{ id: 'blog', label: 'Blog' }],
            edges: [],
          });
        }),
      );

      // Call hook without enabled parameter (uses default true)
      const { result } = renderHook(() => useDependencyGraph('ui', 'blog'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.name).toBe('blog');
    });

    it('should not fetch when enabled is explicitly false', async () => {
      const fetchSpy = jest.fn();

      server.use(
        http.get('/api/architecture/dependencies/:scope/:target', () => {
          fetchSpy();
          return HttpResponse.json({
            name: 'blog',
            label: 'Blog',
            nodes: [],
            edges: [],
          });
        }),
      );

      // Call hook with enabled=false
      const { result } = renderHook(
        () => useDependencyGraph('ui', 'blog', false),
        { wrapper: createWrapper() },
      );

      // Wait a bit to ensure no fetch happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.isFetching).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
