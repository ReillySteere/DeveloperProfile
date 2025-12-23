import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/reset.css';
import './styles/tokens.css';
import * as Sentry from '@sentry/browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { useNavStore } from 'ui/shared/stores/navStore';

Sentry.init({
  dsn: 'https://349f5174f58c6bcd4b3b5fb5fb738ff3@o4509070478147584.ingest.de.sentry.io/4509070482210896', // Replace with your Sentry DSN
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
});

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const theme = useNavStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
};

const rootElement = document.getElementById('root')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}
