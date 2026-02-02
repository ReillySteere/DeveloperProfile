import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { TelemetrySnapshot, ChaosFlags } from 'shared/types';

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseServerEventSourceOptions {
  /** Base URL for the SSE endpoint */
  baseUrl: string;
  /** Maximum number of data points to keep in sliding window */
  maxDataPoints?: number;
  /** Chaos simulation flags to pass to server */
  chaosFlags?: ChaosFlags;
}

interface UseServerEventSourceResult {
  /** Array of telemetry snapshots (sliding window) */
  data: TelemetrySnapshot[];
  /** Most recent snapshot, or null if no data yet */
  latestSnapshot: TelemetrySnapshot | null;
  /** Current connection state */
  connectionState: ConnectionState;
  /** Manually trigger reconnection */
  reconnect: () => void;
  /** Disconnect from the SSE stream */
  disconnect: () => void;
}

/**
 * Custom hook to manage EventSource connection for real-time telemetry.
 * Handles connection lifecycle, reconnection, and sliding window buffer.
 *
 * @see architecture/components/status.md
 */
export function useServerEventSource({
  baseUrl,
  maxDataPoints = 60,
  chaosFlags = { cpu: false, memory: false },
}: UseServerEventSourceOptions): UseServerEventSourceResult {
  const [data, setData] = useState<TelemetrySnapshot[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Build URL with chaos query params
  const url = useMemo(() => {
    const chaosParams: string[] = [];
    if (chaosFlags.cpu) chaosParams.push('cpu');
    if (chaosFlags.memory) chaosParams.push('memory');

    if (chaosParams.length === 0) return baseUrl;
    return `${baseUrl}?chaos=${chaosParams.join(',')}`;
  }, [baseUrl, chaosFlags.cpu, chaosFlags.memory]);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionState('connecting');

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = (): void => {
      setConnectionState('connected');
    };

    eventSource.onmessage = (event: MessageEvent<string>): void => {
      try {
        const snapshot = JSON.parse(event.data) as TelemetrySnapshot;
        setData((prev) => {
          const updated = [...prev, snapshot];
          // Keep only the last N data points (sliding window)
          return updated.slice(-maxDataPoints);
        });
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (): void => {
      setConnectionState('error');
      eventSource.close();

      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [url, maxDataPoints]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setConnectionState('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setData([]); // Clear data on manual reconnect
    connect();
  }, [disconnect, connect]);

  // Connect/disconnect based on chaos flags
  useEffect(() => {
    // Clear data when chaos flags change to show fresh metrics
    setData([]);
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    data,
    latestSnapshot: data[data.length - 1] ?? null,
    connectionState,
    reconnect,
    disconnect,
  };
}
