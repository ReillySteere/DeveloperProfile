import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from 'ui/shared/components';
import { useUnresolvedAlerts, useResolveAlert } from '../hooks/useTraces';
import styles from './AlertsPanel.module.scss';

/**
 * Panel displaying unresolved alerts with ability to resolve them.
 */
function AlertsPanel(): React.ReactNode {
  const { data: alerts, isLoading, error } = useUnresolvedAlerts();
  const resolveAlert = useResolveAlert();

  if (isLoading) {
    return (
      <Card className={styles.container}>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.loading}>Loading alerts...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={styles.container}>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.error}>Failed to load alerts</div>
        </CardContent>
      </Card>
    );
  }

  // After loading and error checks, alerts is guaranteed to be defined
  const unresolvedAlerts = alerts!;

  return (
    <Card className={styles.container}>
      <CardHeader>
        <CardTitle>
          Active Alerts
          {unresolvedAlerts.length > 0 && (
            <span className={styles.badge}>{unresolvedAlerts.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {unresolvedAlerts.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.checkmark}>✓</span>
            <p>No active alerts</p>
          </div>
        ) : (
          <div className={styles.alertList}>
            {unresolvedAlerts.map((alert) => (
              <div key={alert.id} className={styles.alertItem}>
                <div className={styles.alertHeader}>
                  <span className={styles.alertName}>{alert.ruleName}</span>
                  <span className={styles.alertTime}>
                    {' '}
                    {formatTimeAgo(alert.triggeredAt)}
                  </span>
                </div>
                <div className={styles.alertDetails}>
                  <span className={styles.metric}>
                    {formatMetricName(alert.metric)}:{' '}
                    {formatValue(alert.metric, alert.actualValue)}
                  </span>
                  <span className={styles.threshold}>
                    (threshold: {formatValue(alert.metric, alert.threshold)})
                  </span>
                </div>
                <div className={styles.alertActions}>
                  <Button
                    variant="secondary"
                    onClick={() => resolveAlert.mutate({ id: alert.id })}
                    disabled={resolveAlert.isPending}
                  >
                    {resolveAlert.isPending ? 'Resolving...' : 'Resolve'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatMetricName(metric: string): string {
  switch (metric) {
    case 'avgDuration':
      return 'Avg Latency';
    case 'errorRate':
      return 'Error Rate';
    case 'p95Duration':
      return 'P95 Latency';
    default:
      return metric;
  }
}

function formatValue(metric: string, value: number): string {
  if (metric === 'errorRate') {
    return `${value.toFixed(1)}%`;
  }
  return `${value.toFixed(0)}ms`;
}

export default AlertsPanel;
