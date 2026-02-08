import React from 'react';
import type { ComponentMetadata, ViewportSize } from 'shared/types';
import { VIEWPORT_DIMENSIONS } from 'shared/types';
import { useIframeRenderer } from '../hooks/useIframeRenderer';
import { FeatureComponentPreview } from './FeatureComponentPreview';
import styles from '../playground.module.scss';

interface ComponentPreviewProps {
  component: ComponentMetadata;
  props: Record<string, unknown>;
  viewport: ViewportSize;
  theme: 'light' | 'dark';
  showGrid: boolean;
}

export const ComponentPreview: React.FC<ComponentPreviewProps> = ({
  component,
  props,
  viewport,
  theme,
  showGrid,
}) => {
  if (component.renderMode === 'direct') {
    return (
      <FeatureComponentPreview
        component={component}
        props={props}
        viewport={viewport}
        showGrid={showGrid}
      />
    );
  }

  return (
    <IframePreview
      component={component}
      props={props}
      viewport={viewport}
      theme={theme}
      showGrid={showGrid}
    />
  );
};

const IframePreview: React.FC<ComponentPreviewProps> = ({
  component,
  props,
  viewport,
  theme,
  showGrid,
}) => {
  const { iframeRef } = useIframeRenderer({ component, props, theme });
  const dimensions = VIEWPORT_DIMENSIONS[viewport];
  const iframeStyle: React.CSSProperties =
    viewport === 'full'
      ? { width: '100%', minHeight: 300 }
      : { width: dimensions.width, height: dimensions.height };

  return (
    <div
      className={`${styles.previewContainer} ${showGrid ? styles.previewGrid : ''}`}
      data-testid="component-preview"
    >
      <iframe
        ref={iframeRef}
        title={`${component.name} preview`}
        className={styles.previewIframe}
        style={iframeStyle}
        sandbox="allow-same-origin"
      />
    </div>
  );
};
