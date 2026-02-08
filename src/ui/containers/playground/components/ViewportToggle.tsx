import React from 'react';
import { Smartphone, Tablet, Monitor, Maximize } from 'lucide-react';
import type { ViewportSize } from 'shared/types';
import styles from '../playground.module.scss';

interface ViewportToggleProps {
  viewport: ViewportSize;
  onChange: (viewport: ViewportSize) => void;
}

const viewportOptions: {
  size: ViewportSize;
  Icon: React.FC<{ size: number }>;
  label: string;
}[] = [
  { size: 'mobile', Icon: Smartphone, label: 'Mobile (375px)' },
  { size: 'tablet', Icon: Tablet, label: 'Tablet (768px)' },
  { size: 'desktop', Icon: Monitor, label: 'Desktop (1280px)' },
  { size: 'full', Icon: Maximize, label: 'Full width' },
];

export const ViewportToggle: React.FC<ViewportToggleProps> = ({
  viewport,
  onChange,
}) => (
  <div
    className={styles.viewportToggle}
    role="group"
    aria-label="Viewport size"
  >
    {viewportOptions.map(({ size, Icon, label }) => (
      <button
        key={size}
        className={`${styles.viewportButton} ${viewport === size ? styles.viewportButtonActive : ''}`}
        onClick={() => onChange(size)}
        aria-label={label}
        aria-pressed={viewport === size}
      >
        <Icon size={16} />
      </button>
    ))}
  </div>
);
