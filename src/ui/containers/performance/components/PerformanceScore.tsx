import React from 'react';
import { Card, CardContent } from 'ui/shared/components';
import type { WebVitals } from 'shared/types';
import { WEB_VITAL_THRESHOLDS } from 'shared/types';
import {
  calculateScore,
  getScoreColor,
} from 'ui/shared/services/performanceScoring';
import styles from '../performance.module.scss';

interface PerformanceScoreProps {
  vitals: Partial<WebVitals>;
}

export function PerformanceScore({
  vitals,
}: PerformanceScoreProps): React.ReactNode {
  const scores: { name: string; score: number; weight: number }[] = [];

  if (vitals.lcp) {
    scores.push({
      name: 'LCP',
      score: calculateScore(vitals.lcp.value, WEB_VITAL_THRESHOLDS.lcp),
      weight: 0.25,
    });
  }
  if (vitals.cls) {
    scores.push({
      name: 'CLS',
      score: calculateScore(vitals.cls.value, WEB_VITAL_THRESHOLDS.cls),
      weight: 0.25,
    });
  }
  if (vitals.fcp) {
    scores.push({
      name: 'FCP',
      score: calculateScore(vitals.fcp.value, WEB_VITAL_THRESHOLDS.fcp),
      weight: 0.25,
    });
  }
  if (vitals.inp) {
    scores.push({
      name: 'INP',
      score: calculateScore(vitals.inp.value, WEB_VITAL_THRESHOLDS.inp),
      weight: 0.25,
    });
  }

  if (scores.length === 0) {
    return null;
  }

  // Weighted average (redistribute weights if some metrics are missing)
  const totalWeight = scores.reduce((acc, s) => acc + s.weight, 0);
  const overall = Math.round(
    scores.reduce((acc, s) => acc + s.score * (s.weight / totalWeight), 0),
  );

  const color = getScoreColor(overall);

  return (
    <Card className={styles.scoreCard}>
      <CardContent>
        <div className={styles.scoreCircle} style={{ borderColor: color }}>
          <span className={styles.scoreValue} style={{ color }}>
            {overall}
          </span>
        </div>
        <div className={styles.scoreLabel}>Performance Score</div>
        <div className={styles.scoreBreakdown}>
          {scores.map((s) => (
            <div key={s.name} className={styles.scoreItem}>
              <span>{s.name}</span>
              <span style={{ color: getScoreColor(s.score) }}>{s.score}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Re-export for convenience */
export { calculateScore, getScoreColor };
