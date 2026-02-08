import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import { useFocusTracker } from '../hooks/useFocusTracker';
import styles from '../accessibility.module.scss';

export const KeyboardOverlay: React.FC = () => {
  const {
    isTracking,
    focusHistory,
    startTracking,
    stopTracking,
    clearHistory,
  } = useFocusTracker();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyboard Focus Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={styles.trackerControls}>
          <button
            onClick={isTracking ? stopTracking : startTracking}
            className={styles.auditButton}
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>
          {focusHistory.length > 0 && (
            <button onClick={clearHistory} className={styles.secondaryButton}>
              Clear
            </button>
          )}
        </div>

        {isTracking && (
          <p className={styles.trackingHint}>
            Press Tab to navigate through the page. Focus events will be
            recorded below.
          </p>
        )}

        {focusHistory.length > 0 && (
          <ol className={styles.focusList} aria-label="Focus order history">
            {focusHistory.map((entry) => (
              <li
                key={entry.order}
                data-current={entry.isCurrent ? 'true' : undefined}
                className={styles.focusEntry}
              >
                <span className={styles.focusBadge}>#{entry.order}</span>
                <span className={styles.focusTag}>&lt;{entry.tagName}&gt;</span>
                {entry.role && (
                  <span className={styles.focusRole}>
                    role=&quot;{entry.role}&quot;
                  </span>
                )}
                <span className={styles.focusLabel}>{entry.label}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};
