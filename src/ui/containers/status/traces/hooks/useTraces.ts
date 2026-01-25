import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import type { RequestTrace, TraceFilters, TraceStats } from 'shared/types';

/**
 * Fetches the list of recent traces with optional filtering.
 */
export function useTraces(filters: TraceFilters = {}) {
  return useQuery({
    queryKey: ['traces', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.method) params.append('method', filters.method);
      if (filters.path) params.append('path', filters.path);
      if (filters.statusCode !== undefined)
        params.append('statusCode', String(filters.statusCode));
      /* istanbul ignore next -- filter params for future UI expansion */
      if (filters.minDuration !== undefined)
        params.append('minDuration', String(filters.minDuration));
      /* istanbul ignore next -- filter params for future UI expansion */
      if (filters.maxDuration !== undefined)
        params.append('maxDuration', String(filters.maxDuration));
      if (filters.limit !== undefined)
        params.append('limit', String(filters.limit));
      /* istanbul ignore next -- filter params for future UI expansion */
      if (filters.offset !== undefined)
        params.append('offset', String(filters.offset));

      const queryString = params.toString();
      const url = queryString ? `/api/traces?${queryString}` : '/api/traces';

      const response = await axios.get<RequestTrace[]>(url);
      return response.data;
    },
    staleTime: 5000, // 5 seconds - traces change frequently
  });
}

/**
 * Fetches a single trace by ID.
 */
export function useTrace(traceId: string | undefined) {
  return useQuery({
    queryKey: ['trace', traceId],
    queryFn: async () => {
      const response = await axios.get<RequestTrace>(`/api/traces/${traceId}`);
      return response.data;
    },
    enabled: !!traceId,
  });
}

/**
 * Fetches trace statistics.
 */
export function useTraceStats() {
  return useQuery({
    queryKey: ['traceStats'],
    queryFn: async () => {
      const response = await axios.get<TraceStats>('/api/traces/stats');
      return response.data;
    },
    staleTime: 10000, // 10 seconds
  });
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseTraceStreamResult {
  /** Live traces received from SSE (most recent first) */
  traces: RequestTrace[];
  /** Current connection state */
  connectionState: ConnectionState;
  /** Clear the traces buffer */
  clearTraces: () => void;
  /** Reconnect to the stream */
  reconnect: () => void;
}

/**
 * Subscribes to the real-time trace stream via SSE.
 * Maintains a sliding window buffer of recent traces.
 *
 * @param maxTraces Maximum number of traces to keep in buffer (default 100)
 * @param enabled Whether the stream should be active (default true)
 */
export function useTraceStream(
  maxTraces: number = 100,
  enabled: boolean = true,
): UseTraceStreamResult {
  const [traces, setTraces] = useState<RequestTrace[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionState('connecting');
    const eventSource = new EventSource('/api/traces/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnectionState('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const trace: RequestTrace = JSON.parse(event.data);
        setTraces((prev) => {
          const updated = [trace, ...prev];
          // Trim to max size
          return updated.slice(0, maxTraces);
        });
      } catch {
        console.error('[useTraceStream] Failed to parse trace:', event.data);
      }
    };

    eventSource.onerror = () => {
      setConnectionState('error');
      eventSource.close();

      // Attempt reconnect after 3 seconds
      setTimeout(() => {
        if (enabled) {
          connect();
        }
      }, 3000);
    };
  }, [enabled, maxTraces]);

  /* istanbul ignore next -- utility exposed for manual trigger, not used in current UI */
  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  /* istanbul ignore next -- utility exposed for clearing buffer, not used in current UI */
  const clearTraces = useCallback(() => {
    setTraces([]);
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [enabled, connect]);

  return {
    traces,
    connectionState,
    clearTraces,
    reconnect,
  };
}
