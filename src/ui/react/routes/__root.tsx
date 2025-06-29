import React from 'react';
import styles from '../styles.module.scss';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import Navigation from '../containers/navigation';

export const Route = createRootRoute({
  component: () => (
    <div className={styles.container}>
      <Navigation />
      <Outlet />
      <TanStackRouterDevtools />
    </div>
  ),
});
