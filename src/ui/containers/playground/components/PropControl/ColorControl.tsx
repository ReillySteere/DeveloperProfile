import React from 'react';
import styles from '../../playground.module.scss';

interface ColorControlProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorControl: React.FC<ColorControlProps> = ({
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
      type="color"
      className={styles.propInput}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`${name} property`}
    />
  </div>
);
