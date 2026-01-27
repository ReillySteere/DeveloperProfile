import React, { useMemo, useState } from 'react';
import { PhaseTiming } from 'shared/types';
import styles from './TimingWaterfall.module.scss';

interface TimingWaterfallProps {
  timing: PhaseTiming;
  totalDuration: number;
  /** Show detailed breakdown with interactive tooltips */
  expanded?: boolean;
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

/** Threshold for highlighting slow phases (ms) */
const SLOW_PHASE_THRESHOLD = 100;

/** Minimum percentage to show label on bar */
const MIN_PERCENTAGE_FOR_LABEL = 10;

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
  expanded = false,
}: TimingWaterfallProps): React.ReactNode {
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  const phases = useMemo(() => {
    const result: Array<
      (typeof PHASES)[number] & {
        duration: number;
        percentage: number;
        offset: number;
        isSlow: boolean;
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
        isSlow: duration >= SLOW_PHASE_THRESHOLD,
      });
      cumulativeOffset += percentage;
    }

    return result;
  }, [timing, totalDuration]);

  const renderSegment = (
    phase: (typeof phases)[number],
  ): React.ReactNode | null => {
    if (phase.percentage <= 0) return null;

    const isHovered = hoveredPhase === phase.key;
    const showLabel = expanded && phase.percentage >= MIN_PERCENTAGE_FOR_LABEL;

    return (
      <div
        key={phase.key}
        className={`${styles.segment} ${expanded ? styles.segmentExpanded : ''} ${phase.isSlow && expanded ? styles.segmentSlow : ''}`}
        style={{
          width: `${phase.percentage}%`,
          backgroundColor: phase.color,
        }}
        title={
          expanded
            ? undefined
            : `${phase.name}: ${formatDuration(phase.duration)}`
        }
        onMouseEnter={() => expanded && setHoveredPhase(phase.key)}
        onMouseLeave={() => expanded && setHoveredPhase(null)}
      >
        {showLabel && (
          <span className={styles.segmentLabel}>
            {Math.round(phase.percentage)}%
          </span>
        )}
        {expanded && isHovered && (
          <div className={styles.tooltip}>
            <div className={styles.tooltipTitle}>{phase.name}</div>
            <div className={styles.tooltipValue}>
              {formatDuration(phase.duration)}
            </div>
            <div className={styles.tooltipPercentage}>
              {phase.percentage.toFixed(1)}% of total
            </div>
            {phase.isSlow && (
              <div className={styles.tooltipWarning}>⚠ Slow phase</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`${styles.waterfall} ${expanded ? styles.waterfallExpanded : ''}`}
    >
      <div className={styles.header}>
        <span className={styles.title}>Request Timeline</span>
        <span className={styles.total}>{formatDuration(totalDuration)}</span>
      </div>

      <div className={styles.timeline}>
        <div className={styles.bar}>{phases.map(renderSegment)}</div>
      </div>

      <div className={styles.legend}>
        {phases.map((phase) => (
          <div
            key={phase.key}
            className={`${styles.legendItem} ${phase.isSlow && expanded ? styles.legendItemSlow : ''}`}
          >
            <span
              className={styles.legendColor}
              style={{ backgroundColor: phase.color }}
            />
            <span className={styles.legendName}>{phase.name}</span>
            <span className={styles.legendValue}>
              {formatDuration(phase.duration)}
            </span>
            {phase.isSlow && expanded && (
              <span className={styles.slowBadge}>slow</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
