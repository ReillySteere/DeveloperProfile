import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import type { MemoryUsage } from 'shared/types';
import styles from '../performance.module.scss';

interface MemoryChartProps {
  samples: MemoryUsage[];
  isSupported: boolean;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function MemoryChart({
  samples,
  isSupported,
}: MemoryChartProps): React.ReactNode {
  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Memory Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.collecting}>
            Memory API is only available in Chromium browsers.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (samples.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Memory Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.collecting}>Collecting memory samples...</div>
        </CardContent>
      </Card>
    );
  }

  const chartData = samples.map((s) => ({
    time: formatTime(s.timestamp),
    used: s.usedJSHeapSize / (1024 * 1024),
    total: s.totalJSHeapSize / (1024 * 1024),
    limit: s.jsHeapSizeLimit / (1024 * 1024),
  }));

  const currentUsed = samples[samples.length - 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memory Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={styles.memoryStats}>
          <span>Used: {formatBytes(currentUsed.usedJSHeapSize)}</span>
          <span>Total: {formatBytes(currentUsed.totalJSHeapSize)}</span>
          <span>Limit: {formatBytes(currentUsed.jsHeapSizeLimit)}</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v.toFixed(0)} MB`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
              }}
              formatter={(value) => {
                const val = value as number | null | undefined;
                return val != null ? [`${val.toFixed(1)} MB`] : ['N/A'];
              }}
            />
            <ReferenceLine
              y={chartData[0]?.limit}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: 'Limit', position: 'right', fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="used"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.2}
              name="Used Heap"
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#94a3b8"
              fill="#94a3b8"
              fillOpacity={0.1}
              name="Total Heap"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
