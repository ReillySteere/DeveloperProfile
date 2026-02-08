import React from 'react';
import type { PropDefinition } from 'shared/types';
import { StringControl } from './StringControl';
import { BooleanControl } from './BooleanControl';
import { NumberControl } from './NumberControl';
import { SelectControl } from './SelectControl';
import { ColorControl } from './ColorControl';
import { JsonControl } from './JsonControl';

interface PropControlProps {
  prop: PropDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

export const PropControl: React.FC<PropControlProps> = ({
  prop,
  value,
  onChange,
}) => {
  switch (prop.controlType) {
    case 'boolean':
      return (
        <BooleanControl
          name={prop.name}
          value={Boolean(value)}
          onChange={onChange}
        />
      );
    case 'number':
      return (
        <NumberControl
          name={prop.name}
          value={Number(value) || 0}
          onChange={onChange}
        />
      );
    case 'select':
      return (
        <SelectControl
          name={prop.name}
          value={String(value || '')}
          options={prop.options || []}
          onChange={onChange}
        />
      );
    case 'color':
      return (
        <ColorControl
          name={prop.name}
          value={String(value || '#000000')}
          onChange={onChange}
        />
      );
    case 'string':
      return (
        <StringControl
          name={prop.name}
          value={String(value ?? '')}
          onChange={onChange}
        />
      );
    case 'json':
      return <JsonControl name={prop.name} value={value} onChange={onChange} />;
    default:
      return null;
  }
};
