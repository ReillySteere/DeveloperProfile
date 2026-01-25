import React from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';

/**
 * Architecture layout route - renders child routes via Outlet
 * Child routes: /architecture (index), /architecture/$slug, /architecture/dependencies, /architecture/components/$slug
 */
export const Route = createFileRoute('/architecture')({
  component: ArchitectureLayout,
});

function ArchitectureLayout() {
  return <Outlet />;
}
