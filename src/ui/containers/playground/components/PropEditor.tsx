import React from 'react';
import type { PropDefinition } from 'shared/types';
import { PropControl } from './PropControl/PropControl';
import { Button } from 'ui/shared/components';
import { RotateCcw } from 'lucide-react';
import styles from '../playground.module.scss';

interface PropEditorProps {
  props: PropDefinition[];
  values: Record<string, unknown>;
  onPropChange: (name: string, value: unknown) => void;
  onReset: () => void;
}

export const PropEditor: React.FC<PropEditorProps> = ({
  props: propDefs,
  values,
  onPropChange,
  onReset,
}) => {
  const editableProps = propDefs.filter(
    (p) => p.controlType !== 'function' && p.controlType !== 'node',
  );

  return (
    <div
      className={styles.propEditor}
      data-testid="prop-editor"
      role="group"
      aria-label="Component properties"
    >
      <div className={styles.propEditorHeader}>
        <h3>Props</h3>
        <Button
          variant="secondary"
          onClick={onReset}
          leftIcon={<RotateCcw size={14} />}
          aria-label="Reset props"
        >
          Reset
        </Button>
      </div>
      {editableProps.map((prop) => (
        <PropControl
          key={prop.name}
          prop={prop}
          value={values[prop.name]}
          onChange={(val) => onPropChange(prop.name, val)}
        />
      ))}
    </div>
  );
};
