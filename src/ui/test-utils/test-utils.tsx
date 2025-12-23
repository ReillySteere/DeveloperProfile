import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const AllTheProviders = ({ children }: { children?: React.ReactNode }) => {
  const testQueryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
