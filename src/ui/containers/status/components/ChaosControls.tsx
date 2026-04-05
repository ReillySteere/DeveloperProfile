import type { ChaosFlags } from 'shared/types';
import React from 'react';
import styles from './ChaosControls.module.scss';

interface ChaosControlsProps {
  /** Current chaos flags state */
  readonly chaosFlags: ChaosFlags;
  /** Callback to toggle a chaos flag */
  readonly onToggle: (key: keyof ChaosFlags) => void;
}

/**
 * Toggle controls for chaos simulation.
 * Allows users to simulate CPU and memory pressure.
 */
export function ChaosControls({ chaosFlags, onToggle }: ChaosControlsProps) {
  return (
    <div className={styles.container}>
      <p className={styles.info}>
        🔬 <strong>Simulation Mode:</strong> These controls simulate system
        stress for demonstration. The actual server remains healthy—only the
        reported metrics are modified.
      </p>

      <div className={styles.controls}>
        <button
          className={styles.toggle}
          data-active={chaosFlags.cpu}
          onClick={() => onToggle('cpu')}
          aria-pressed={chaosFlags.cpu}
          type="button"
        >
          {chaosFlags.cpu ? '🔥 CPU Stress ON' : '💤 CPU Stress OFF'}
        </button>

        <button
          className={styles.toggle}
          data-active={chaosFlags.memory}
          onClick={() => onToggle('memory')}
          aria-pressed={chaosFlags.memory}
          type="button"
        >
          {chaosFlags.memory ? '🔥 Memory Stress ON' : '💤 Memory Stress OFF'}
        </button>
      </div>

      {(chaosFlags.cpu || chaosFlags.memory) && (
        <p className={styles.activeHint}>
          Watch the heartbeat accelerate and charts spike! 📈
        </p>
      )}
    </div>
  );
}
