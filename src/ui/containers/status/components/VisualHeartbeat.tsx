import React, { useMemo } from 'react';
import styles from './VisualHeartbeat.module.scss';

interface VisualHeartbeatProps {
  /** Current event loop lag in milliseconds */
  lagMs: number;
  /** Whether SSE connection is active */
  isConnected: boolean;
}

type HealthStatus = 'healthy' | 'warning' | 'critical' | 'disconnected';

/**
 * Animated pulse indicator that syncs with event loop lag.
 * Higher lag = faster/more erratic pulse.
 */
export function VisualHeartbeat({ lagMs, isConnected }: VisualHeartbeatProps) {
  // Map lag to animation speed: higher lag = faster/erratic pulse
  const animationDuration = useMemo((): string => {
    if (!isConnected) return '2s';

    // Normal: ~1ms lag = calm 1.5s pulse
    // High: >50ms lag = rapid 0.3s pulse
    const baseDuration = 1.5;
    const minDuration = 0.3;
    const lagFactor = Math.min(lagMs / 50, 1);
    const duration = baseDuration - lagFactor * (baseDuration - minDuration);

    return `${duration.toFixed(2)}s`;
  }, [lagMs, isConnected]);

  const healthStatus = useMemo((): HealthStatus => {
    if (!isConnected) return 'disconnected';
    if (lagMs < 5) return 'healthy';
    if (lagMs < 20) return 'warning';
    return 'critical';
  }, [lagMs, isConnected]);

  return (
    <div className={styles.container}>
      <div
        className={styles.heartbeat}
        data-status={healthStatus}
        style={
          { '--animation-duration': animationDuration } as React.CSSProperties
        }
      >
        <div className={styles.pulse} />
        <div className={styles.core} />
      </div>
      <div className={styles.metrics}>
        <span className={styles.value}>{lagMs.toFixed(1)}ms</span>
        <span className={styles.label}>Event Loop Lag</span>
      </div>
    </div>
  );
}
