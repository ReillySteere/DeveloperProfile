import React, { useMemo } from 'react';
import { PhaseTiming } from 'shared/types';
import styles from './TimingWaterfall.module.scss';

interface TimingWaterfallProps {
  timing: PhaseTiming;
  totalDuration: number;
}

interface PhaseData {
  name: string;
  key: keyof PhaseTiming;
  color: string;
}

const PHASES: PhaseData[] = [
  { name: 'Middleware', key: 'middleware', color: '#3b82f6' },
  { name: 'Guard', key: 'guard', color: '#8b5cf6' },
  { name: 'Interceptor Pre', key: 'interceptorPre', color: '#f59e0b' },
  { name: 'Handler', key: 'handler', color: '#22c55e' },
  { name: 'Interceptor Post', key: 'interceptorPost', color: '#06b6d4' },
];

function formatDuration(ms: number): string {
  if (ms < 1) {
    return '<1ms';
  }
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

export function TimingWaterfall({
  timing,
  totalDuration,
}: TimingWaterfallProps): React.ReactNode {
  const phases = useMemo(() => {
    const result: Array<
      (typeof PHASES)[number] & {
        duration: number;
        percentage: number;
        offset: number;
      }
    > = [];
    let cumulativeOffset = 0;

    for (const phase of PHASES) {
      const duration = timing[phase.key] ?? 0;
      const percentage =
        totalDuration > 0 ? (duration / totalDuration) * 100 : 0;
      result.push({
        ...phase,
        duration,
        percentage,
        offset: cumulativeOffset,
      });
      cumulativeOffset += percentage;
    }

    return result;
  }, [timing, totalDuration]);

  return (
    <div className={styles.waterfall}>
      <div className={styles.header}>
        <span className={styles.title}>Request Timeline</span>
        <span className={styles.total}>{formatDuration(totalDuration)}</span>
      </div>

      <div className={styles.timeline}>
        <div className={styles.bar}>
          {phases.map((phase) =>
            phase.percentage > 0 ? (
              <div
                key={phase.key}
                className={styles.segment}
                style={{
                  width: `${phase.percentage}%`,
                  backgroundColor: phase.color,
                }}
                title={`${phase.name}: ${formatDuration(phase.duration)}`}
              />
            ) : null,
          )}
        </div>
      </div>

      <div className={styles.legend}>
        {phases.map((phase) => (
          <div key={phase.key} className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{ backgroundColor: phase.color }}
            />
            <span className={styles.legendName}>{phase.name}</span>
            <span className={styles.legendValue}>
              {formatDuration(phase.duration)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
