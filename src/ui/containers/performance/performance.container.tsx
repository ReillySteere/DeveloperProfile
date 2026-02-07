import React, { useEffect } from 'react';
import { Frame } from 'ui/shared/components';
import { WebVitalsDisplay } from './components/WebVitalsDisplay';
import { PerformanceScore } from './components/PerformanceScore';
import { NetworkWaterfall } from './components/NetworkWaterfall';
import { MemoryChart } from './components/MemoryChart';
import { BenchmarkComparison } from './components/BenchmarkComparison';
import { BundleSizeTreemap } from './components/BundleSizeTreemap';
import { useWebVitals } from './hooks/useWebVitals';
import {
  useBenchmarks,
  useBundleAnalysis,
} from './hooks/usePerformanceMetrics';
import { useMemoryUsage } from './hooks/useMemoryUsage';
import { useNetworkTiming } from './hooks/useNetworkTiming';
import { performanceObserver } from 'ui/shared/services/performanceObserver';
import styles from './performance.module.scss';

export default function PerformanceContainer(): React.ReactNode {
  const vitals = useWebVitals();
  const { data: benchmarks } = useBenchmarks();
  const { data: bundleData } = useBundleAnalysis();
  const { samples: memorySamples, isSupported: memorySupported } =
    useMemoryUsage();
  const { resources } = useNetworkTiming();

  // Report metrics to server when page is about to unload
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        performanceObserver.reportToServer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (typeof performance === 'undefined') {
    return (
      <Frame id="performance">
        <div className={styles.container}>
          <div className={styles.notSupported}>
            Performance API not supported in this browser.
          </div>
        </div>
      </Frame>
    );
  }

  return (
    <Frame id="performance">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Performance Observatory</h1>
          <p className={styles.subtitle}>
            Real-time performance monitoring for this site
          </p>
        </div>

        <div className={styles.dashboardGrid}>
          <div className={styles.fullWidth}>
            <PerformanceScore vitals={vitals} />
          </div>

          <div className={styles.fullWidth}>
            <WebVitalsDisplay vitals={vitals} />
          </div>

          <NetworkWaterfall resources={resources} />

          <MemoryChart samples={memorySamples} isSupported={memorySupported} />

          {benchmarks && (
            <div className={styles.fullWidth}>
              <BenchmarkComparison benchmarks={benchmarks} vitals={vitals} />
            </div>
          )}

          {bundleData && (
            <div className={styles.fullWidth}>
              <BundleSizeTreemap
                modules={bundleData.modules}
                totalSize={bundleData.totalSize}
                gzippedSize={bundleData.gzippedSize}
              />
            </div>
          )}
        </div>
      </div>
    </Frame>
  );
}
