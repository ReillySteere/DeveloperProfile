import React from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';

/**
 * Traces layout route - renders child routes via Outlet
 * Child routes: /status/traces (index), /status/traces/$traceId
 */
export const Route = createFileRoute('/status/traces')({
  component: TracesLayout,
});

function TracesLayout() {
  return <Outlet />;
}
