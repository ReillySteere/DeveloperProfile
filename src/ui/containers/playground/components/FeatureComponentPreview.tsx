import React, { Suspense } from 'react';
import type { ComponentMetadata, ViewportSize } from 'shared/types';
import { VIEWPORT_DIMENSIONS } from 'shared/types';
import { Skeleton } from 'ui/shared/components';
import { getFeatureComponent } from './ComponentRegistry';
import styles from '../playground.module.scss';

interface FeatureComponentPreviewProps {
  component: ComponentMetadata;
  props: Record<string, unknown>;
  viewport: ViewportSize;
  showGrid: boolean;
}

export const FeatureComponentPreview: React.FC<
  FeatureComponentPreviewProps
> = ({ component, props, viewport, showGrid }) => {
  const Component = getFeatureComponent(component.name);
  const dimensions = VIEWPORT_DIMENSIONS[viewport];
  const containerStyle: React.CSSProperties =
    viewport === 'full'
      ? { width: '100%', minHeight: 300 }
      : { width: dimensions.width, maxHeight: dimensions.height };

  const mergedProps = { ...(component.sampleData ?? {}), ...props };

  return (
    <div
      className={`${styles.previewContainer} ${showGrid ? styles.previewGrid : ''}`}
      data-testid="component-preview"
    >
      <div style={containerStyle} className={styles.directPreview}>
        <Suspense fallback={<Skeleton height={200} />}>
          {Component ? (
            <Component {...mergedProps} />
          ) : (
            <p>Component &quot;{component.name}&quot; not found in registry</p>
          )}
        </Suspense>
      </div>
    </div>
  );
};
