import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import { useTraceEndpointStats } from '../hooks/useTraces';
import styles from './EndpointBreakdown.module.scss';

interface EndpointBreakdownProps {
  limit: number;
}

function formatDuration(ms: number): string {
  if (ms < 1) {
    return '<1ms';
  }
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function getMethodClass(method: string): string {
  const upperMethod = method.toUpperCase();
  const methodClasses: Record<string, string> = {
    GET: styles.methodGet,
    POST: styles.methodPost,
    PUT: styles.methodPut,
    PATCH: styles.methodPut,
    DELETE: styles.methodDelete,
  };
  return methodClasses[upperMethod] ?? styles.methodGet;
}

export function EndpointBreakdown({
  limit,
}: EndpointBreakdownProps): React.ReactNode {
  const {
    data: endpointStats,
    isLoading,
    error,
  } = useTraceEndpointStats(limit);

  if (isLoading) {
    return (
      <Card className={styles.container}>
        <CardHeader>
          <CardTitle>Top Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.loading}>Loading endpoints...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={styles.container}>
        <CardHeader>
          <CardTitle>Top Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.error}>Failed to load endpoints</div>
        </CardContent>
      </Card>
    );
  }

  if (!endpointStats || endpointStats.length === 0) {
    return (
      <Card className={styles.container}>
        <CardHeader>
          <CardTitle>Top Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.empty}>No endpoint data yet</div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...endpointStats.map((e) => e.count));

  return (
    <Card className={styles.container}>
      <CardHeader>
        <CardTitle>Top Endpoints</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={styles.list}>
          <div className={styles.header}>
            <span className={styles.headerMethod}>Method</span>
            <span className={styles.headerPath}>Path</span>
            <span className={styles.headerCount}>Requests</span>
            <span className={styles.headerLatency}>Avg Latency</span>
            <span className={styles.headerErrors}>Errors</span>
          </div>
          {endpointStats.map((endpoint) => (
            <div
              key={`${endpoint.method}-${endpoint.path}`}
              className={styles.row}
            >
              <span
                className={`${styles.method} ${getMethodClass(endpoint.method)}`}
              >
                {endpoint.method}
              </span>
              <span className={styles.path} title={endpoint.path}>
                {endpoint.path}
              </span>
              <div className={styles.countCell}>
                <span className={styles.count}>{endpoint.count}</span>
                <div
                  className={styles.countBar}
                  style={{ width: `${(endpoint.count / maxCount) * 100}%` }}
                />
              </div>
              <span className={styles.latency}>
                {formatDuration(endpoint.avgDuration)}
              </span>
              <span
                className={`${styles.errors} ${endpoint.errorRate > 5 ? styles.errorHigh : ''}`}
              >
                {endpoint.errorRate.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
