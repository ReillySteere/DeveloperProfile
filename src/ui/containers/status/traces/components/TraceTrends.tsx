import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import { useTraceHourlyStats } from '../hooks/useTraces';
import styles from './TraceTrends.module.scss';

interface TraceTrendsProps {
  hours?: number;
}

function formatHour(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function TraceTrends({ hours = 24 }: TraceTrendsProps): React.ReactNode {
  const { data: hourlyStats, isLoading, error } = useTraceHourlyStats(hours);

  if (isLoading) {
    return (
      <Card className={styles.container}>
        <CardHeader>
          <CardTitle>Request Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.loading}>Loading trends...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={styles.container}>
        <CardHeader>
          <CardTitle>Request Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.error}>Failed to load trends</div>
        </CardContent>
      </Card>
    );
  }

  if (!hourlyStats || hourlyStats.length === 0) {
    return (
      <Card className={styles.container}>
        <CardHeader>
          <CardTitle>Request Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.empty}>No data available yet</div>
        </CardContent>
      </Card>
    );
  }

  const chartData = hourlyStats.map((stat) => ({
    ...stat,
    formattedHour: formatHour(stat.hour),
  }));

  return (
    <Card className={styles.container}>
      <CardHeader>
        <CardTitle>Request Trends (Last {hours}h)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="formattedHour"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                yAxisId="latency"
                orientation="left"
                tick={{ fontSize: 12 }}
                tickLine={false}
                label={{
                  value: 'Duration (ms)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 },
                }}
              />
              <YAxis
                yAxisId="errors"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={false}
                domain={[0, 100]}
                label={{
                  value: 'Error %',
                  angle: 90,
                  position: 'insideRight',
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                }}
                labelFormatter={(label) => `Time: ${label}`}
                formatter={(value, name) => {
                  const val = Number(value ?? 0);
                  const label = String(name ?? '');
                  if (label === 'Avg Latency' || label === 'P95 Latency') {
                    return [`${val.toFixed(0)}ms`, label];
                  }
                  return [`${val.toFixed(1)}%`, label];
                }}
              />
              <Legend />
              <Line
                yAxisId="latency"
                type="monotone"
                dataKey="avgDuration"
                stroke="#6366f1"
                name="Avg Latency"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="latency"
                type="monotone"
                dataKey="p95Duration"
                stroke="#8b5cf6"
                name="P95 Latency"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
              <Line
                yAxisId="errors"
                type="monotone"
                dataKey="errorRate"
                stroke="#ef4444"
                name="Error Rate"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
