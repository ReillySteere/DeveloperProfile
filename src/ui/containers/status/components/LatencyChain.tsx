import React from 'react';
import styles from './LatencyChain.module.scss';

interface LatencyChainProps {
  /** Server-side latency (event loop lag) in milliseconds */
  serverLatency: number;
  /** Database query latency in milliseconds */
  dbLatency: number;
}

type HealthLevel = 'good' | 'warning' | 'critical';

function getHealth(latency: number): HealthLevel {
  if (latency < 5) return 'good';
  if (latency < 20) return 'warning';
  return 'critical';
}

/**
 * Visual representation of the latency chain from Client to Database.
 * Shows latency at each hop with color-coded health indicators.
 */
export function LatencyChain({ serverLatency, dbLatency }: LatencyChainProps) {
  const clientToServer = serverLatency;
  const serverToDb = dbLatency;
  const total = clientToServer + serverToDb;

  return (
    <div className={styles.chain}>
      <div className={styles.node}>
        <span className={styles.icon}>🖥️</span>
        <span className={styles.label}>Client</span>
      </div>

      <div
        className={styles.connection}
        data-health={getHealth(clientToServer)}
      >
        <span className={styles.latency}>{clientToServer.toFixed(1)}ms</span>
        <div className={styles.line} />
      </div>

      <div className={styles.node}>
        <span className={styles.icon}>⚙️</span>
        <span className={styles.label}>Server</span>
      </div>

      <div className={styles.connection} data-health={getHealth(serverToDb)}>
        <span className={styles.latency}>{serverToDb.toFixed(1)}ms</span>
        <div className={styles.line} />
      </div>

      <div className={styles.node}>
        <span className={styles.icon}>🗄️</span>
        <span className={styles.label}>Database</span>
      </div>

      <div className={styles.totalLatency}>
        Total Round Trip: <strong>{total.toFixed(1)}ms</strong>
      </div>
    </div>
  );
}
