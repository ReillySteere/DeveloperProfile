import React from 'react';
import type { PropOption } from 'shared/types';
import styles from '../../playground.module.scss';

interface SelectControlProps {
  name: string;
  value: string;
  options: PropOption[];
  onChange: (value: string) => void;
}

export const SelectControl: React.FC<SelectControlProps> = ({
  name,
  value,
  options,
  onChange,
}) => (
  <div className={styles.propField}>
    <label className={styles.propLabel} htmlFor={`prop-${name}`}>
      {name}
    </label>
    <select
      id={`prop-${name}`}
      className={styles.propSelect}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`${name} property`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);
