import { useState, useEffect } from 'react';
import { performanceObserver } from 'ui/shared/services/performanceObserver';
import type { WebVitals } from 'shared/types';

export function useWebVitals() {
  const [vitals, setVitals] = useState<Partial<WebVitals>>(
    performanceObserver.getCurrentMetrics(),
  );

  useEffect(() => {
    const unsubscribe = performanceObserver.subscribe((metric) => {
      setVitals((prev) => ({
        ...prev,
        [metric.name.toLowerCase()]: metric,
      }));
    });

    return unsubscribe;
  }, []);

  return vitals;
}
