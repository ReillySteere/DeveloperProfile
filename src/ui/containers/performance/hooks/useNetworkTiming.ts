import { useState, useEffect } from 'react';
import type { ResourceTiming, NavigationTiming } from 'shared/types';

export function useNetworkTiming() {
  const [resources, setResources] = useState<ResourceTiming[]>([]);
  const [navigation, setNavigation] = useState<NavigationTiming | null>(null);

  useEffect(() => {
    if (typeof performance === 'undefined') return;

    const collectTimings = () => {
      // Collect resource timings
      const entries = performance.getEntriesByType(
        'resource',
      ) as PerformanceResourceTiming[];

      setResources(
        entries.map((entry) => ({
          name: entry.name.split('/').pop() || entry.name,
          entryType: entry.entryType,
          startTime: entry.startTime,
          duration: entry.duration,
          transferSize: entry.transferSize,
          decodedBodySize: entry.decodedBodySize,
          initiatorType: entry.initiatorType,
        })),
      );

      // Collect navigation timing
      const navEntries = performance.getEntriesByType(
        'navigation',
      ) as PerformanceNavigationTiming[];

      if (navEntries.length > 0) {
        const timing = navEntries[0];
        setNavigation({
          dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
          tcpConnection: timing.connectEnd - timing.connectStart,
          tlsNegotiation:
            timing.secureConnectionStart > 0
              ? timing.connectEnd - timing.secureConnectionStart
              : 0,
          requestTime: timing.responseStart - timing.requestStart,
          responseTime: timing.responseEnd - timing.responseStart,
          domParsing: timing.domInteractive - timing.responseEnd,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.startTime,
          windowLoaded: timing.loadEventEnd - timing.startTime,
        });
      }
    };

    // Collect after page load completes
    if (document.readyState === 'complete') {
      collectTimings();
    } else {
      window.addEventListener('load', collectTimings);
      return () => window.removeEventListener('load', collectTimings);
    }
  }, []);

  return { resources, navigation };
}
