import { lazy, type ComponentType } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyComponent = React.LazyExoticComponent<ComponentType<any>>;

/* istanbul ignore next -- lazy callbacks execute at render time, not import time */
const registry: Record<string, LazyComponent> = {
  // Feature components
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

  // Shared components
  Button: lazy(() =>
    import('ui/shared/components').then((m) => ({ default: m.Button })),
  ),
  Badge: lazy(() =>
    import('ui/shared/components').then((m) => ({ default: m.Badge })),
  ),
  Card: lazy(() =>
    import('ui/shared/components').then((m) => ({ default: m.Card })),
  ),
  CardHeader: lazy(() =>
    import('ui/shared/components').then((m) => ({ default: m.CardHeader })),
  ),
  CardTitle: lazy(() =>
    import('ui/shared/components').then((m) => ({ default: m.CardTitle })),
  ),
  CardContent: lazy(() =>
    import('ui/shared/components').then((m) => ({ default: m.CardContent })),
  ),
  CardFooter: lazy(() =>
    import('ui/shared/components').then((m) => ({ default: m.CardFooter })),
  ),
  Skeleton: lazy(() =>
    import('ui/shared/components').then((m) => ({ default: m.Skeleton })),
  ),
  LinkButton: lazy(() =>
    import('ui/shared/components').then((m) => ({ default: m.LinkButton })),
  ),
};

export function getRegisteredComponent(
  name: string,
): LazyComponent | undefined {
  return registry[name];
}

export function isRegisteredComponent(name: string): boolean {
  return name in registry;
}

/** @deprecated Use getRegisteredComponent instead */
export const getFeatureComponent = getRegisteredComponent;
/** @deprecated Use isRegisteredComponent instead */
export const isFeatureComponent = isRegisteredComponent;
