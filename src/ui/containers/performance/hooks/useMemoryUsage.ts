import { useState, useEffect, useRef } from 'react';
import type { MemoryUsage } from 'shared/types';

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export function useMemoryUsage(intervalMs: number = 5000) {
  const [samples, setSamples] = useState<MemoryUsage[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const isSupported =
    typeof performance !== 'undefined' &&
    !!(performance as PerformanceWithMemory).memory;

  useEffect(() => {
    if (!isSupported) return;

    const collectSample = () => {
      const memory = (performance as PerformanceWithMemory).memory!;
      setSamples((prev) => {
        const newSample: MemoryUsage = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          timestamp: Date.now(),
        };
        // Keep last 60 samples (5 minutes at default interval)
        const updated = [...prev, newSample];
        return updated.slice(-60);
      });
    };

    collectSample();
    intervalRef.current = setInterval(collectSample, intervalMs);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [intervalMs, isSupported]);

  return { samples, isSupported };
}
