import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';
import { RouterProvider, createRouter } from '@tanstack/react-router';

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

const rootElement = document.getElementById('root')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
