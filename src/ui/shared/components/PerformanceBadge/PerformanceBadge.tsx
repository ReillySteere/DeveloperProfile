import React from 'react';
import { Link } from '@tanstack/react-router';
import { useWebVitals } from 'ui/shared/hooks/useWebVitals';
import {
  calculateScore,
  getScoreColor,
} from 'ui/shared/services/performanceScoring';
import { WEB_VITAL_THRESHOLDS } from 'shared/types';
import styles from './PerformanceBadge.module.scss';

export function PerformanceBadge(): React.ReactNode {
  const vitals = useWebVitals();
  const scores: number[] = [];

  if (vitals.lcp) {
    scores.push(calculateScore(vitals.lcp.value, WEB_VITAL_THRESHOLDS.lcp));
  }
  if (vitals.cls) {
    scores.push(calculateScore(vitals.cls.value, WEB_VITAL_THRESHOLDS.cls));
  }
  if (vitals.fcp) {
    scores.push(calculateScore(vitals.fcp.value, WEB_VITAL_THRESHOLDS.fcp));
  }

  if (scores.length === 0) return null;

  const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const color = getScoreColor(overall);

  return (
    <Link
      to="/performance"
      className={styles.badge}
      data-testid="performance-badge"
      aria-label={`Performance score: ${overall}`}
    >
      <span className={styles.dot} style={{ backgroundColor: color }} />
      <span className={styles.score} style={{ color }}>
        {overall}
      </span>
    </Link>
  );
}
