import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import type { Benchmark, WebVitals } from 'shared/types';

interface BenchmarkComparisonProps {
  benchmarks: Benchmark[];
  vitals: Partial<WebVitals>;
}

export function BenchmarkComparison({
  benchmarks,
  vitals,
}: BenchmarkComparisonProps): React.ReactNode {
  const chartData = benchmarks
    .filter((b) => b.metric !== 'cls') // CLS scale is too different
    .map((b) => {
      const vitalKey = b.metric as keyof WebVitals;
      const currentValue = vitals[vitalKey]?.value;

      return {
        metric: b.metric.toUpperCase(),
        'Your Site': currentValue ? Math.round(currentValue) : null,
        'P50 (Median)': b.p50,
        'P75 (Target)': b.p75,
        'P90 (Slow)': b.p90,
      };
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Industry Benchmarks</CardTitle>
      </CardHeader>
      <CardContent>
        <div data-testid="benchmark-chart">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barCategoryGap="20%">
              <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}ms`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                }}
                formatter={(value) => {
                  const val = value as number | null;
                  return val !== null ? [`${val}ms`] : ['N/A'];
                }}
              />
              <Legend />
              <Bar dataKey="Your Site" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="P50 (Median)"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="P75 (Target)"
                fill="#eab308"
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey="P90 (Slow)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
