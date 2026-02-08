import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import {
  contrastRatio,
  getWCAGLevel,
} from 'ui/shared/services/contrastCalculator';
import type { ContrastPair } from '../accessibility.types';
import styles from '../accessibility.module.scss';

const COLOR_PAIRS: ContrastPair[] = [
  {
    name: 'Primary Text',
    foreground: '#0f172a',
    background: '#f8fafc',
    usage: 'Body text on light background',
  },
  {
    name: 'Secondary Text',
    foreground: '#475569',
    background: '#f8fafc',
    usage: 'Subtitle and secondary content',
  },
  {
    name: 'Inverse Text',
    foreground: '#ffffff',
    background: '#4f46e5',
    usage: 'Text on primary buttons',
  },
  {
    name: 'Dark Primary Text',
    foreground: '#f8fafc',
    background: '#020617',
    usage: 'Body text on dark background',
  },
  {
    name: 'Dark Secondary',
    foreground: '#94a3b8',
    background: '#020617',
    usage: 'Subtitle text in dark mode',
  },
  {
    name: 'Link on Light',
    foreground: '#4f46e5',
    background: '#f8fafc',
    usage: 'Interactive links',
  },
];

export const ContrastChecker: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contrast Checker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={styles.contrastTableWrapper}>
          <table
            className={styles.contrastTable}
            aria-label="Color contrast ratios"
          >
            <thead>
              <tr>
                <th>Pair</th>
                <th>Colors</th>
                <th>Ratio</th>
                <th>Normal</th>
                <th>Large</th>
              </tr>
            </thead>
            <tbody>
              {COLOR_PAIRS.map((pair) => {
                const ratio = contrastRatio(pair.foreground, pair.background);
                const normalLevel = getWCAGLevel(ratio, false);
                const largeLevel = getWCAGLevel(ratio, true);
                return (
                  <tr key={pair.name}>
                    <td>
                      <div className={styles.pairName}>{pair.name}</div>
                      <div className={styles.pairUsage}>{pair.usage}</div>
                    </td>
                    <td>
                      <div className={styles.swatchRow}>
                        <span
                          className={styles.contrastSwatch}
                          style={{ backgroundColor: pair.foreground }}
                          aria-label={`Foreground ${pair.foreground}`}
                        />
                        <span
                          className={styles.contrastSwatch}
                          style={{ backgroundColor: pair.background }}
                          aria-label={`Background ${pair.background}`}
                        />
                      </div>
                    </td>
                    <td className={styles.ratioValue}>{ratio.toFixed(2)}:1</td>
                    <td>
                      <span
                        className={styles.wcagBadge}
                        data-level={normalLevel}
                      >
                        {normalLevel}
                      </span>
                    </td>
                    <td>
                      <span
                        className={styles.wcagBadge}
                        data-level={largeLevel}
                      >
                        {largeLevel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
