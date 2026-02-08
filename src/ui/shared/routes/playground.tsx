import React from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';

/**
 * Playground layout route - renders child routes via Outlet
 * Child routes: /playground (index), /playground/$componentId
 */
export const Route = createFileRoute('/playground')({
  component: PlaygroundLayout,
});

function PlaygroundLayout() {
  return <Outlet />;
}
