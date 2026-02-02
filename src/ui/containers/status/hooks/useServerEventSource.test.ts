import { renderHook, act, waitFor } from '@testing-library/react';
import { useServerEventSource } from './useServerEventSource';

// Mock EventSource
class MockEventSource {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  url: string;
  readyState = 0;

  static instances: MockEventSource[] = [];

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
    // Simulate async connection
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.();
    }, 10);
  }

  close = jest.fn(() => {
    this.readyState = 2;
  });
}

// Replace global EventSource with mock
const originalEventSource = global.EventSource;

beforeEach(() => {
  MockEventSource.instances = [];
  (global as unknown as { EventSource: typeof MockEventSource }).EventSource =
    MockEventSource;
});

afterEach(() => {
  (global as unknown as { EventSource: typeof EventSource }).EventSource =
    originalEventSource;
});

describe('useServerEventSource', () => {
  describe('default parameters', () => {
    it('should use default maxDataPoints when not provided', async () => {
      // Only pass required baseUrl to trigger default maxDataPoints = 60
      const { result } = renderHook(() =>
        useServerEventSource({
          baseUrl: '/api/health/stream',
        }),
      );

      await waitFor(() => {
        expect(result.current.connectionState).toBe('connected');
      });

      // Verify the hook works with defaults
      expect(result.current.data).toEqual([]);
      expect(result.current.latestSnapshot).toBeNull();
    });

    it('should use default chaosFlags when not provided', async () => {
      // Only pass baseUrl and maxDataPoints to trigger default chaosFlags
      const { result } = renderHook(() =>
        useServerEventSource({
          baseUrl: '/api/health/stream',
          maxDataPoints: 30,
        }),
      );

      await waitFor(() => {
        expect(result.current.connectionState).toBe('connected');
      });

      // Verify URL doesn't have chaos params (defaults are { cpu: false, memory: false })
      const eventSource = MockEventSource.instances[0];
      expect(eventSource.url).toBe('/api/health/stream');
      expect(eventSource.url).not.toContain('chaos=');
    });

    it('should use all defaults when only baseUrl is provided', async () => {
      const { result } = renderHook(() =>
        useServerEventSource({
          baseUrl: '/api/health/stream',
        }),
      );

      await waitFor(() => {
        expect(result.current.connectionState).toBe('connected');
      });

      // Verify connection established with default parameters
      expect(MockEventSource.instances.length).toBe(1);
      expect(MockEventSource.instances[0].url).toBe('/api/health/stream');
    });
  });

  describe('chaos flags URL building', () => {
    it('should add cpu chaos param when cpu flag is true', async () => {
      const { result } = renderHook(() =>
        useServerEventSource({
          baseUrl: '/api/health/stream',
          chaosFlags: { cpu: true, memory: false },
        }),
      );

      await waitFor(() => {
        expect(result.current.connectionState).toBe('connected');
      });

      expect(MockEventSource.instances[0].url).toBe(
        '/api/health/stream?chaos=cpu',
      );
    });

    it('should add memory chaos param when memory flag is true', async () => {
      const { result } = renderHook(() =>
        useServerEventSource({
          baseUrl: '/api/health/stream',
          chaosFlags: { cpu: false, memory: true },
        }),
      );

      await waitFor(() => {
        expect(result.current.connectionState).toBe('connected');
      });

      expect(MockEventSource.instances[0].url).toBe(
        '/api/health/stream?chaos=memory',
      );
    });

    it('should add both chaos params when both flags are true', async () => {
      const { result } = renderHook(() =>
        useServerEventSource({
          baseUrl: '/api/health/stream',
          chaosFlags: { cpu: true, memory: true },
        }),
      );

      await waitFor(() => {
        expect(result.current.connectionState).toBe('connected');
      });

      expect(MockEventSource.instances[0].url).toBe(
        '/api/health/stream?chaos=cpu,memory',
      );
    });
  });

  describe('disconnect', () => {
    it('should close EventSource and update state', async () => {
      const { result } = renderHook(() =>
        useServerEventSource({
          baseUrl: '/api/health/stream',
        }),
      );

      await waitFor(() => {
        expect(result.current.connectionState).toBe('connected');
      });

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.connectionState).toBe('disconnected');
      expect(MockEventSource.instances[0].close).toHaveBeenCalled();
    });
  });
});
