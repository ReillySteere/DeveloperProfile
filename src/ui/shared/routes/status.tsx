import { createFileRoute, Outlet } from '@tanstack/react-router';
import React from 'react';

/**
 * Status layout route - renders child routes via Outlet
 * Child routes: /status (index), /status/traces, /status/traces/$traceId
 */
export const Route = createFileRoute('/status')({
  component: StatusLayout,
});

function StatusLayout() {
  return <Outlet />;
}
