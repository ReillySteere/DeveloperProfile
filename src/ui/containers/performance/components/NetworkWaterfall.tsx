import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import type { ResourceTiming } from 'shared/types';
import styles from '../performance.module.scss';

interface NetworkWaterfallProps {
  resources: ResourceTiming[];
}

const typeColors: Record<string, string> = {
  script: '#6366f1',
  link: '#8b5cf6',
  img: '#22c55e',
  fetch: '#f97316',
  xmlhttprequest: '#f97316',
  css: '#ec4899',
  font: '#06b6d4',
  other: '#94a3b8',
};

export function NetworkWaterfall({
  resources,
}: NetworkWaterfallProps): React.ReactNode {
  if (resources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Network Waterfall</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.collecting}>
            No resource timing data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Take top 20 resources by duration, sorted by start time
  const chartData = [...resources]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 20)
    .sort((a, b) => a.startTime - b.startTime)
    .map((r) => ({
      name: r.name.length > 30 ? `...${r.name.slice(-27)}` : r.name,
      startTime: Math.round(r.startTime),
      duration: Math.round(r.duration),
      type: r.initiatorType,
      fullName: r.name,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Waterfall</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={styles.legendRow}>
          {Object.entries(typeColors)
            .slice(0, 6)
            .map(([type, color]) => (
              <span key={type} className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ backgroundColor: color }}
                />
                {type}
              </span>
            ))}
        </div>
        <ResponsiveContainer
          width="100%"
          height={Math.max(250, chartData.length * 28)}
        >
          <BarChart data={chartData} layout="vertical" barSize={14}>
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v}ms`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={180}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
              }}
              formatter={(value, name) => [
                `${value as number}ms`,
                String(name) === 'duration' ? 'Duration' : 'Start',
              ]}
            />
            <Bar dataKey="duration" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={typeColors[entry.type] || typeColors.other}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
