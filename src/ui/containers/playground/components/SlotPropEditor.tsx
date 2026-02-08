import React, { useState } from 'react';
import type { CompositionSlot, ComponentMetadata } from 'shared/types';
import { PropControl } from './PropControl/PropControl';
import styles from '../playground.module.scss';

interface SlotPropEditorProps {
  slot: CompositionSlot;
  componentMetadata: ComponentMetadata | undefined;
  currentProps: Record<string, unknown>;
  onPropChange: (propName: string, value: unknown) => void;
}

export function SlotPropEditor({
  slot,
  componentMetadata,
  currentProps,
  onPropChange,
}: SlotPropEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const editableProps = componentMetadata?.props?.filter(
    (p) => p.controlType !== 'function' && p.controlType !== 'node',
  );

  if (!editableProps?.length) {
    return null;
  }

  return (
    <div
      className={styles.slotPropEditor}
      data-testid={`slot-editor-${slot.id}`}
    >
      <button
        className={styles.slotPropToggle}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`slot-props-${slot.id}`}
      >
        Edit Props
        <span className={styles.toggleIcon}>
          {isExpanded ? '\u25BC' : '\u25B6'}
        </span>
      </button>
      {isExpanded && (
        <div
          className={styles.slotPropControls}
          id={`slot-props-${slot.id}`}
          role="group"
          aria-label={`${slot.label} properties`}
        >
          {editableProps.map((prop) => (
            <PropControl
              key={prop.name}
              prop={prop}
              value={currentProps[prop.name]}
              onChange={(value) => onPropChange(prop.name, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
