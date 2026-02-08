import React, { Suspense } from 'react';
import type { CompositionTemplate, ComponentMetadata } from 'shared/types';
import { Skeleton } from 'ui/shared/components';
import { getRegisteredComponent } from './ComponentRegistry';
import { SlotPropEditor } from './SlotPropEditor';
import styles from '../playground.module.scss';

interface CompositionEditorProps {
  template: CompositionTemplate;
  slotProps: Record<string, Record<string, unknown>>;
  components?: ComponentMetadata[];
  onSlotPropChange?: (slotId: string, name: string, value: unknown) => void;
}

export const CompositionEditor: React.FC<CompositionEditorProps> = ({
  template,
  slotProps,
  components,
  onSlotPropChange,
}) => {
  return (
    <div data-testid="composition-editor" className={styles.compositionEditor}>
      <div className={styles.compositionPreview} data-layout={template.layout}>
        {template.slots.map((slot) => {
          const Component = getRegisteredComponent(slot.componentName);
          const mergedProps = {
            ...slot.props,
            ...(slotProps[slot.id] || {}),
          };
          const metadata = components?.find(
            (c) => c.name === slot.componentName,
          );

          return (
            <div
              key={slot.id}
              className={styles.compositionSlot}
              data-testid={`slot-${slot.id}`}
              role="region"
              aria-label={`${slot.label} slot`}
            >
              <div className={styles.slotHeader}>
                <div className={styles.slotLabel}>{slot.label}</div>
                {onSlotPropChange && (
                  <SlotPropEditor
                    slot={slot}
                    componentMetadata={metadata}
                    currentProps={mergedProps}
                    onPropChange={(name, value) =>
                      onSlotPropChange(slot.id, name, value)
                    }
                  />
                )}
              </div>
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
