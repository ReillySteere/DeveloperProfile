import React from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';

/**
 * Blog layout route - renders child routes via Outlet
 * Child routes: /blog (index), /blog/$slug, /blog/create
 */
export const Route = createFileRoute('/blog')({
  component: BlogLayout,
});

function BlogLayout() {
  return <Outlet />;
}
