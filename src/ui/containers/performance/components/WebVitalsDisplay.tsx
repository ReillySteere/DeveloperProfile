import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import { VitalGauge } from './VitalGauge';
import type { WebVitals } from 'shared/types';
import { WEB_VITAL_THRESHOLDS } from 'shared/types';
import styles from '../performance.module.scss';

interface WebVitalsDisplayProps {
  vitals: Partial<WebVitals>;
}

const vitalConfig = [
  {
    key: 'lcp' as const,
    label: 'LCP',
    unit: 'ms',
    description: 'Largest Contentful Paint',
  },
  {
    key: 'inp' as const,
    label: 'INP',
    unit: 'ms',
    description: 'Interaction to Next Paint',
  },
  {
    key: 'cls' as const,
    label: 'CLS',
    unit: '',
    description: 'Cumulative Layout Shift',
  },
  {
    key: 'fcp' as const,
    label: 'FCP',
    unit: 'ms',
    description: 'First Contentful Paint',
  },
  {
    key: 'ttfb' as const,
    label: 'TTFB',
    unit: 'ms',
    description: 'Time to First Byte',
  },
] as const;

export function WebVitalsDisplay({
  vitals,
}: WebVitalsDisplayProps): React.ReactNode {
  const hasVitals = Object.keys(vitals).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Core Web Vitals</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasVitals ? (
          <div className={styles.collecting}>
            Collecting metrics... Navigate the site to gather data.
          </div>
        ) : (
          <div className={styles.vitalsGrid}>
            {vitalConfig.map(({ key, label, unit }) => {
              const metric = vitals[key];
              if (!metric) return null;

              return (
                <VitalGauge
                  key={key}
                  name={label}
                  value={metric.value}
                  rating={metric.rating}
                  unit={unit || ''}
                  thresholds={WEB_VITAL_THRESHOLDS[key]}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
