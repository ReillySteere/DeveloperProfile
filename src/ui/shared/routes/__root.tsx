import React from 'react';
import styles from 'ui/styles.module.scss';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { NavigationRail } from 'ui/shared/components';

export const Route = createRootRoute({
  component: () => (
    <div className={styles.container}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>
      <NavigationRail />
      <Outlet />
      <ReactQueryDevtools initialIsOpen={false} />
      <TanStackRouterDevtools />
    </div>
  ),
  notFoundComponent: () => (
    <div className={styles.container}>
      <h1>Page Not Found</h1>
    </div>
  ),
});
