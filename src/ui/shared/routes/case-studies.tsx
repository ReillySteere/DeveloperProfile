import React from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';

/**
 * Case Studies layout route - renders child routes via Outlet
 * Child routes: /case-studies (index), /case-studies/$slug
 */
export const Route = createFileRoute('/case-studies')({
  component: CaseStudiesLayout,
});

function CaseStudiesLayout() {
  return <Outlet />;
}
