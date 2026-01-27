import React from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  Frame,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from 'ui/shared/components';
import { TimingWaterfall } from './components';
import { useTrace } from './hooks/useTraces';
import styles from './trace-detail.module.scss';

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}

function getMethodClass(method: string): string {
  return styles[`method${method}`] || '';
}

function getStatusClass(status: number): string {
  if (status >= 500) return styles.status5xx;
  if (status >= 400) return styles.status4xx;
  if (status >= 300) return styles.status3xx;
  if (status >= 200) return styles.status2xx;
  return '';
}

/**
 * Trace Detail Container
 * Displays detailed information about a single request trace.
 */
export default function TraceDetailContainer() {
  const { traceId } = useParams({ from: '/status/traces/$traceId' });
  const navigate = useNavigate();

  const { data: trace, isLoading, error } = useTrace(traceId);

  const handleBack = () => {
    navigate({ to: '/status/traces' });
  };

  if (isLoading) {
    return (
      <Frame id="trace-detail">
        <div className={styles.container}>
          <div className={styles.loading}>Loading trace details...</div>
        </div>
      </Frame>
    );
  }

  if (error || !trace) {
    return (
      <Frame id="trace-detail">
        <div className={styles.container}>
          <div className={styles.error}>
            <p>Failed to load trace: {error?.message ?? 'Trace not found'}</p>
            <Button variant="secondary" onClick={handleBack}>
              Back to Traces
            </Button>
          </div>
        </div>
      </Frame>
    );
  }

  return (
    <Frame id="trace-detail">
      <div className={styles.container}>
        <header className={styles.header}>
          <Button
            variant="secondary"
            onClick={handleBack}
            className={styles.backBtn}
          >
            ← Back
          </Button>
          <h1>Trace Details</h1>
        </header>

        <div className={styles.summary}>
          <Card>
            <CardHeader>
              <CardTitle>Request Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <dt>Trace ID</dt>
                  <dd className={styles.mono}>{trace.traceId}</dd>
                </div>
                <div className={styles.infoItem}>
                  <dt>Method</dt>
                  <dd>
                    <span
                      className={`${styles.method} ${getMethodClass(trace.method)}`}
                    >
                      {trace.method}
                    </span>
                  </dd>
                </div>
                <div className={styles.infoItem}>
                  <dt>Path</dt>
                  <dd className={styles.mono}>{trace.path}</dd>
                </div>
                <div className={styles.infoItem}>
                  <dt>Status</dt>
                  <dd
                    className={`${styles.status} ${getStatusClass(trace.statusCode)}`}
                  >
                    {trace.statusCode}
                  </dd>
                </div>
                <div className={styles.infoItem}>
                  <dt>Duration</dt>
                  <dd className={styles.mono}>{trace.durationMs}ms</dd>
                </div>
                <div className={styles.infoItem}>
                  <dt>Timestamp</dt>
                  <dd>{formatTimestamp(trace.timestamp)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className={styles.timing}>
          <h2>Request Timeline</h2>
          <TimingWaterfall
            timing={trace.timing}
            totalDuration={trace.durationMs}
            expanded
          />
        </div>

        <div className={styles.metadata}>
          <Card>
            <CardHeader>
              <CardTitle>Request Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className={styles.infoGrid}>
                {trace.userId && (
                  <div className={styles.infoItem}>
                    <dt>User ID</dt>
                    <dd className={styles.mono}>{trace.userId}</dd>
                  </div>
                )}
                <div className={styles.infoItem}>
                  <dt>IP Address</dt>
                  <dd className={styles.mono}>{trace.ip ?? 'N/A'}</dd>
                </div>
                <div className={styles.infoItem}>
                  <dt>User Agent</dt>
                  <dd className={styles.userAgent}>
                    {trace.userAgent ?? 'N/A'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </Frame>
  );
}
