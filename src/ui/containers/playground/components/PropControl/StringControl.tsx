import React from 'react';
import styles from '../../playground.module.scss';

interface StringControlProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
}

export const StringControl: React.FC<StringControlProps> = ({
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
      type="text"
      className={styles.propInput}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`${name} property`}
    />
  </div>
);
