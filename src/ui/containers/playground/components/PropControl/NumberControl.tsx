import React from 'react';
import styles from '../../playground.module.scss';

interface NumberControlProps {
  name: string;
  value: number;
  onChange: (value: number) => void;
}

export const NumberControl: React.FC<NumberControlProps> = ({
  name,
  value,
  onChange,
}) => (
  <div className={styles.propField}>
    <label className={styles.propLabel} htmlFor={`prop-${name}`}>
      {name}
    </label>
    <input
      id={`prop-${name}`}
      type="number"
      className={styles.propInput}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={`${name} property`}
    />
  </div>
);
