import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import { useLandmarks } from '../hooks/useLandmarks';
import styles from '../accessibility.module.scss';

export const LandmarkVisualizer: React.FC = () => {
  const { landmarks, refresh } = useLandmarks();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Landmark Regions</CardTitle>
      </CardHeader>
      <CardContent>
        <button onClick={refresh} className={styles.auditButton}>
          Refresh
        </button>

        {landmarks.length === 0 ? (
          <p className={styles.emptyState}>No landmark regions detected.</p>
        ) : (
          <ul
            className={styles.landmarkTree}
            aria-label="Page landmark regions"
          >
            {landmarks.map((lm, i) => (
              <li
                key={`${lm.role}-${lm.element}-${i}`}
                className={styles.landmarkNode}
              >
                <span className={styles.landmarkRole}>{lm.role}</span>
                <span className={styles.landmarkElement}>
                  &lt;{lm.element}&gt;
                </span>
                {lm.label && (
                  <span className={styles.landmarkLabel}>
                    &quot;{lm.label}&quot;
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
