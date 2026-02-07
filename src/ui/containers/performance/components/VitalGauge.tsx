import React from 'react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from 'recharts';
import type { WebVitalRating } from 'shared/types';
import styles from '../performance.module.scss';

interface VitalGaugeProps {
  name: string;
  value: number;
  rating: WebVitalRating;
  unit: string;
  thresholds: { good: number; poor: number };
}

const ratingColors: Record<WebVitalRating, string> = {
  good: '#22c55e',
  'needs-improvement': '#eab308',
  poor: '#ef4444',
};

export function VitalGauge({
  name,
  value,
  rating,
  unit,
  thresholds,
}: VitalGaugeProps): React.ReactNode {
  // Normalize value to 0-100 scale based on thresholds
  const maxVal = thresholds.poor * 1.5;
  const normalizedValue = Math.min(100, (value / maxVal) * 100);

  const data = [
    {
      name,
      value: normalizedValue,
      fill: ratingColors[rating],
    },
  ];

  return (
    <div
      className={styles.gaugeContainer}
      data-testid={`${name.toLowerCase()}-gauge`}
    >
      <ResponsiveContainer width="100%" height={140}>
        <RadialBarChart
          cx="50%"
          cy="80%"
          innerRadius="60%"
          outerRadius="100%"
          barSize={12}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={6}
            angleAxisId={0}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className={styles.gaugeLabel}>
        <span
          className={styles.gaugeValue}
          style={{ color: ratingColors[rating] }}
        >
          {unit === 'ms' ? Math.round(value) : value.toFixed(3)}
        </span>
        <span className={styles.gaugeUnit}>{unit}</span>
        <span className={styles.gaugeName}>{name}</span>
      </div>
    </div>
  );
}
