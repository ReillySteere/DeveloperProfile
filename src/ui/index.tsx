import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './shared/styles/reset.css';
import './shared/styles/tokens.css';
import * as Sentry from '@sentry/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { useNavStore } from 'ui/shared/hooks/useNavStore';
import { AuthInterceptor } from 'ui/shared/components/AuthInterceptor/AuthInterceptor';
import { SignInModal } from 'ui/shared/components/SignIn/SignInModal';

// Only initialize Sentry in production or when DSN is explicitly provided
const sentryDsn =
  process.env.SENTRY_DSN ||
  (process.env.NODE_ENV === 'production'
    ? 'https://eb783d6134fbc05925302caf50fc87bf@o4510728628797440.ingest.us.sentry.io/4510728630042624'
    : '');

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

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
        <AuthInterceptor />
        <SignInModal />
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}
