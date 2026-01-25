import React, { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Frame,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from 'ui/shared/components';
import { TraceRow, TraceFilters } from './components';
import { useTraces, useTraceStats, useTraceStream } from './hooks/useTraces';
import { TraceFilters as TraceFiltersType } from 'shared/types';
import styles from './traces.module.scss';

/**
 * Request Traces Container
 * Displays real-time request traces with filtering and live streaming.
 *
 * @see architecture/components/traces.md
 */
export default function TracesContainer() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TraceFiltersType>({ limit: 50 });
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Static trace list
  const { data: traces, isLoading, error, refetch } = useTraces(filters);

  // Live trace stream
  const { traces: liveTraces, connectionState } = useTraceStream(
    50,
    isLiveMode,
  );
  const isConnected = connectionState === 'connected';

  // Stats for summary cards
  const { data: stats } = useTraceStats();

  const handleFiltersChange = useCallback((newFilters: TraceFiltersType) => {
    setFilters(newFilters);
    setIsLiveMode(false); // Switch to static mode when filtering
  }, []);

  const handleTraceClick = useCallback(
    (traceId: string) => {
      navigate({ to: '/status/traces/$traceId', params: { traceId } });
    },
    [navigate],
  );

  const handleToggleLiveMode = useCallback(() => {
    setIsLiveMode((prev) => !prev);
  }, []);

  const displayTraces = isLiveMode ? liveTraces : (traces ?? []);

  return (
    <Frame id="traces">
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1>Request Traces</h1>
            <div className={styles.controls}>
              <button
                type="button"
                className={`${styles.liveToggle} ${isLiveMode ? styles.active : ''}`}
                onClick={handleToggleLiveMode}
                aria-pressed={isLiveMode}
              >
                <span className={styles.liveDot} data-connected={isConnected} />
                {isLiveMode ? 'Live' : 'Static'}
              </button>
              <button
                type="button"
                className={styles.refreshBtn}
                onClick={() => refetch()}
                disabled={isLoading || isLiveMode}
              >
                Refresh
              </button>
            </div>
          </div>
          {stats && (
            <div className={styles.statsRow}>
              <Card className={styles.statCard}>
                <CardHeader>
                  <CardTitle>Total Traces (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className={styles.statValue}>{stats.totalCount}</span>
                </CardContent>
              </Card>
              <Card className={styles.statCard}>
                <CardHeader>
                  <CardTitle>Avg Latency</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className={styles.statValue}>
                    {stats.avgDuration.toFixed(0)}ms
                  </span>
                </CardContent>
              </Card>
              <Card className={styles.statCard}>
                <CardHeader>
                  <CardTitle>Error Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <span
                    className={`${styles.statValue} ${stats.errorRate > 5 ? styles.error : ''}`}
                  >
                    {stats.errorRate.toFixed(1)}%
                  </span>
                </CardContent>
              </Card>
            </div>
          )}
        </header>

        {!isLiveMode && (
          <TraceFilters
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
          />
        )}

        <section className={styles.traceList}>
          <div className={styles.listHeader}>
            <span>Method</span>
            <span>Path</span>
            <span>Status</span>
            <span>Duration</span>
            <span>Time</span>
          </div>

          {error && (
            <div className={styles.error}>
              Failed to load traces: {error.message}
            </div>
          )}

          {isLoading && !isLiveMode && (
            <div className={styles.loading}>Loading traces...</div>
          )}

          {!isLoading && displayTraces.length === 0 && (
            <div className={styles.empty}>
              No traces found. Make some API requests to see them here.
            </div>
          )}

          {displayTraces.map((trace) => (
            <TraceRow
              key={trace.traceId}
              trace={trace}
              onClick={handleTraceClick}
            />
          ))}
        </section>
      </div>
    </Frame>
  );
}
