import React from 'react';
import styles from '../../playground.module.scss';

interface BooleanControlProps {
  name: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export const BooleanControl: React.FC<BooleanControlProps> = ({
  name,
  value,
  onChange,
}) => (
  <div className={styles.propField}>
    <div className={styles.propCheckbox}>
      <input
        id={`prop-${name}`}
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={`${name} property`}
      />
      <label className={styles.propLabel} htmlFor={`prop-${name}`}>
        {name}
      </label>
    </div>
  </div>
);
