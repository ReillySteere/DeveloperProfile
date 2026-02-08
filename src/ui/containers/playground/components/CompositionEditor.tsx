import React, { Suspense } from 'react';
import type { CompositionTemplate } from 'shared/types';
import { Skeleton } from 'ui/shared/components';
import { getFeatureComponent } from './ComponentRegistry';
import styles from '../playground.module.scss';

interface CompositionEditorProps {
  template: CompositionTemplate;
  slotProps: Record<string, Record<string, unknown>>;
}

export const CompositionEditor: React.FC<CompositionEditorProps> = ({
  template,
  slotProps,
}) => {
  return (
    <div data-testid="composition-editor" className={styles.compositionEditor}>
      <div className={styles.compositionPreview} data-layout={template.layout}>
        {template.slots.map((slot) => {
          const Component = getFeatureComponent(slot.componentName);
          const mergedProps = {
            ...slot.props,
            ...(slotProps[slot.id] || {}),
          };

          return (
            <div
              key={slot.id}
              className={styles.compositionSlot}
              data-testid={`slot-${slot.id}`}
              role="region"
              aria-label={`${slot.label} slot`}
            >
              <div className={styles.slotLabel}>{slot.label}</div>
              <Suspense fallback={<Skeleton height={150} />}>
                {Component ? (
                  <Component {...mergedProps} />
                ) : (
                  <p>Component &quot;{slot.componentName}&quot; not found</p>
                )}
              </Suspense>
            </div>
          );
        })}
      </div>
    </div>
  );
};
