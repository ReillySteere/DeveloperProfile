import React, { useState, useCallback } from 'react';
import styles from '../../playground.module.scss';

interface JsonControlProps {
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

export const JsonControl: React.FC<JsonControlProps> = ({
  name,
  value,
  onChange,
}) => {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setText(newText);
      try {
        const parsed = JSON.parse(newText) as unknown;
        setError(null);
        onChange(parsed);
      } catch {
        setError('Invalid JSON');
      }
    },
    [onChange],
  );

  return (
    <div>
      <textarea
        aria-label={`${name} property`}
        aria-invalid={error !== null}
        className={`${styles.propInput} ${error ? styles.propInputError : ''}`}
        value={text}
        onChange={handleChange}
        rows={4}
      />
      {error && <span className={styles.propError}>{error}</span>}
    </div>
  );
};
