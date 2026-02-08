import { lazy, type ComponentType } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyComponent = React.LazyExoticComponent<ComponentType<any>>;

/* istanbul ignore next -- lazy callbacks execute at render time, not import time */
const registry: Record<string, LazyComponent> = {
  VitalGauge: lazy(() =>
    import('ui/containers/performance/components/VitalGauge').then((m) => ({
      default: m.VitalGauge,
    })),
  ),
  WebVitalsDisplay: lazy(() =>
    import('ui/containers/performance/components/WebVitalsDisplay').then(
      (m) => ({ default: m.WebVitalsDisplay }),
    ),
  ),
  BundleSizeTreemap: lazy(() =>
    import('ui/containers/performance/components/BundleSizeTreemap').then(
      (m) => ({ default: m.BundleSizeTreemap }),
    ),
  ),
  CodeComparisonViewer: lazy(() =>
    import('ui/containers/case-studies/components/CodeComparisonViewer').then(
      (m) => ({ default: m.CodeComparisonViewer }),
    ),
  ),
  AxeAuditPanel: lazy(() =>
    import('ui/containers/accessibility/components/AxeAuditPanel').then(
      (m) => ({ default: m.AxeAuditPanel }),
    ),
  ),
  ContrastChecker: lazy(() =>
    import('ui/containers/accessibility/components/ContrastChecker').then(
      (m) => ({ default: m.ContrastChecker }),
    ),
  ),
};

export function getFeatureComponent(name: string): LazyComponent | undefined {
  return registry[name];
}

export function isFeatureComponent(name: string): boolean {
  return name in registry;
}
