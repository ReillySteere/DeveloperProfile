import React from 'react';
import type { RequestTrace } from 'shared/types';
import styles from './TraceRow.module.scss';

interface TraceRowProps {
  trace: RequestTrace;
  onClick?: (traceId: string) => void;
}

/**
 * Displays a single trace in a compact row format.
 */
export const TraceRow = ({ trace, onClick }: TraceRowProps) => {
  const statusClass = getStatusClass(trace.statusCode);
  const methodClass = getMethodClass(trace.method);

  const handleClick = () => onClick?.(trace.traceId);

  return (
    <div
      className={styles.traceRow}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <span className={`${styles.method} ${styles[methodClass]}`}>
        {trace.method}
      </span>
      <span className={styles.path} title={trace.path}>
        {trace.path}
      </span>
      <span className={`${styles.status} ${styles[statusClass]}`}>
        {trace.statusCode}
      </span>
      <span className={styles.duration}>
        {formatDuration(trace.durationMs)}
      </span>
      <span className={styles.timestamp}>
        {formatTimestamp(trace.timestamp)}
      </span>
    </div>
  );
};

function getStatusClass(status: number): string {
  if (status >= 500) return 'status5xx';
  if (status >= 400) return 'status4xx';
  if (status >= 300) return 'status3xx';
  if (status >= 200) return 'status2xx';
  return 'status1xx';
}

function getMethodClass(method: string): string {
  return `method${method.toUpperCase()}`;
}

function formatDuration(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default TraceRow;
