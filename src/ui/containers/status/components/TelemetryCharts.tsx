import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TelemetrySnapshot } from 'shared/types';
import styles from './TelemetryCharts.module.scss';

interface TelemetryChartsProps {
  data: TelemetrySnapshot[];
}

interface ChartDataPoint {
  time: number;
  eventLoopLag: number;
  dbLatency: number;
  heapUsed: number;
  rss: number;
}

/**
 * Real-time line charts for telemetry metrics.
 * Displays event loop lag, DB latency, and memory usage.
 */
export function TelemetryCharts({ data }: TelemetryChartsProps) {
  const chartData = useMemo((): ChartDataPoint[] => {
    return data.map((snapshot, index) => ({
      time: index,
      eventLoopLag: snapshot.eventLoop.lagMs,
      dbLatency: snapshot.database.latencyMs,
      heapUsed: snapshot.memory.heapUsedMB,
      rss: snapshot.memory.rssMB,
    }));
  }, [data]);

  const formatTime = (t: number): string => `-${60 - t}s`;

  return (
    <div className={styles.chartsGrid}>
      {/* Event Loop & DB Latency */}
      <div className={styles.chartCard}>
        <h3>Latency (ms)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" tickFormatter={formatTime} stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="eventLoopLag"
              name="Event Loop"
              stroke="#00ff88"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="dbLatency"
              name="Database"
              stroke="#ff6b6b"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Memory Usage */}
      <div className={styles.chartCard}>
        <h3>Memory (MB)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" tickFormatter={formatTime} stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="heapUsed"
              name="Heap Used"
              stroke="#4ecdc4"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="rss"
              name="RSS"
              stroke="#ffe66d"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
