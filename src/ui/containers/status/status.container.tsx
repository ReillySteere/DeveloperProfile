import React, { useState } from 'react';
import { Frame } from 'ui/shared/components';
import {
  TelemetryCharts,
  LatencyChain,
  VisualHeartbeat,
  ChaosControls,
} from './components';
import { useServerEventSource } from './hooks/useServerEventSource';
import type { ChaosFlags } from 'shared/types';
import styles from './status.module.scss';

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

/**
 * Mission Control Telemetry Dashboard
 * Displays real-time system metrics via Server-Sent Events.
 *
 * @see architecture/components/status.md
 */
export default function Status() {
  // Chaos state is client-side only (production-safe)
  const [chaosFlags, setChaosFlags] = useState<ChaosFlags>({
    cpu: false,
    memory: false,
  });

  const { data, latestSnapshot, connectionState, reconnect } =
    useServerEventSource({
      baseUrl: '/api/health/stream',
      maxDataPoints: 60,
      chaosFlags,
    });

  const handleChaosToggle = (key: keyof ChaosFlags): void => {
    setChaosFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Frame id="status">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Mission Control</h1>
          <div className={styles.connectionStatus} data-state={connectionState}>
            {connectionState === 'connected'
              ? '● Connected'
              : `○ ${connectionState}`}
            {connectionState === 'error' && (
              <button
                onClick={reconnect}
                className={styles.reconnectBtn}
                type="button"
              >
                Reconnect
              </button>
            )}
          </div>
        </header>

        <section className={styles.heartbeatSection}>
          <VisualHeartbeat
            lagMs={latestSnapshot?.eventLoop.lagMs ?? 0}
            isConnected={connectionState === 'connected'}
          />
        </section>

        <section className={styles.latencySection}>
          <h2>Latency Chain</h2>
          <LatencyChain
            serverLatency={latestSnapshot?.eventLoop.lagMs ?? 0}
            dbLatency={latestSnapshot?.database.latencyMs ?? 0}
          />
        </section>

        <section className={styles.chartsSection}>
          <h2>Real-Time Metrics</h2>
          <TelemetryCharts data={data} />
        </section>

        <section className={styles.chaosSection}>
          <h2>Chaos Controls</h2>
          <ChaosControls chaosFlags={chaosFlags} onToggle={handleChaosToggle} />
        </section>

        <section className={styles.systemInfo}>
          <h2>System Info</h2>
          {latestSnapshot && (
            <dl className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <dt>Process ID</dt>
                <dd>{latestSnapshot.process.pid}</dd>
              </div>
              <div className={styles.infoItem}>
                <dt>Node Version</dt>
                <dd>{latestSnapshot.process.nodeVersion}</dd>
              </div>
              <div className={styles.infoItem}>
                <dt>Uptime</dt>
                <dd>{formatUptime(latestSnapshot.process.uptimeSeconds)}</dd>
              </div>
              <div className={styles.infoItem}>
                <dt>Database</dt>
                <dd>
                  {latestSnapshot.database.connected
                    ? '✓ Connected'
                    : '✗ Disconnected'}
                </dd>
              </div>
            </dl>
          )}
        </section>
      </div>
    </Frame>
  );
}
