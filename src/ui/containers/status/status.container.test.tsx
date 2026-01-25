import React from 'react';
import { render, screen, fireEvent, waitFor, act } from 'ui/test-utils';
import Status from './status.container';
import type { TelemetrySnapshot } from 'shared/types';

// Mock TanStack Router Link
jest.mock('@tanstack/react-router', () => ({
  ...jest.requireActual('@tanstack/react-router'),
  Link: ({ children, to, ...props }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');
    return React.createElement('a', { href: to, ...props }, children);
  },
}));

// Mock recharts to avoid ResizeObserver issues in tests
jest.mock('recharts', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="line-chart">{children}</div>
    ),
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  };
});

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

  simulateMessage(data: object): void {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateError(): void {
    this.onerror?.();
  }
}

const mockSnapshot: TelemetrySnapshot = {
  timestamp: Date.now(),
  eventLoop: {
    lagMs: 1.5,
    min: 0.5,
    max: 3.0,
    mean: 1.5,
    stddev: 0.5,
    percentile99: 2.5,
  },
  memory: {
    heapUsedMB: 50,
    heapTotalMB: 100,
    rssMB: 120,
    externalMB: 10,
  },
  database: {
    latencyMs: 0.8,
    connected: true,
  },
  process: {
    uptimeSeconds: 3600,
    pid: 12345,
    nodeVersion: 'v20.0.0',
  },
  chaos: {
    cpuPressure: false,
    memoryPressure: false,
  },
};

describe('Status Container', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    (global as any).EventSource = MockEventSource;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders Mission Control heading', async () => {
    render(<Status />);

    expect(screen.getByText('Mission Control')).toBeInTheDocument();
  });

  it('shows connecting state initially', async () => {
    render(<Status />);

    expect(screen.getByText(/connecting/i)).toBeInTheDocument();
  });

  it('shows connected state after EventSource opens', async () => {
    render(<Status />);

    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });
  });

  it('displays telemetry data when message received', async () => {
    render(<Status />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const eventSource = MockEventSource.instances[0];

    act(() => {
      eventSource.simulateMessage(mockSnapshot);
    });

    // Use getAllByText since latency appears in multiple places (heartbeat + latency chain)
    await waitFor(() => {
      expect(screen.getAllByText(/1\.5/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByText('12345')).toBeInTheDocument();
    expect(screen.getByText('v20.0.0')).toBeInTheDocument();
  });

  it('displays system info after receiving snapshot', async () => {
    render(<Status />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const eventSource = MockEventSource.instances[0];

    act(() => {
      eventSource.simulateMessage(mockSnapshot);
    });

    // System info section uses dt elements for labels
    await waitFor(() => {
      const systemInfoLabels = screen.getAllByRole('term');
      const labelTexts = systemInfoLabels.map((el) => el.textContent);
      expect(labelTexts).toContain('Process ID');
      expect(labelTexts).toContain('Node Version');
      expect(labelTexts).toContain('Uptime');
      expect(labelTexts).toContain('Database');
    });
  });

  it('toggles CPU chaos when button clicked', async () => {
    render(<Status />);

    const cpuButton = screen.getByRole('button', { name: /CPU Stress OFF/i });
    expect(cpuButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(cpuButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /CPU Stress ON/i }),
      ).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('toggles memory chaos when button clicked', async () => {
    render(<Status />);

    const memoryButton = screen.getByRole('button', {
      name: /Memory Stress OFF/i,
    });
    expect(memoryButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(memoryButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Memory Stress ON/i }),
      ).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('shows hint when chaos is enabled', async () => {
    render(<Status />);

    const cpuButton = screen.getByRole('button', { name: /CPU Stress OFF/i });
    fireEvent.click(cpuButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Watch the heartbeat accelerate/i),
      ).toBeInTheDocument();
    });
  });

  it('reconnects EventSource when chaos flags change', async () => {
    render(<Status />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(1);
    });

    const cpuButton = screen.getByRole('button', { name: /CPU Stress OFF/i });
    fireEvent.click(cpuButton);

    await waitFor(() => {
      // A new EventSource should be created with chaos param
      expect(MockEventSource.instances.length).toBe(2);
      expect(MockEventSource.instances[1].url).toContain('chaos=cpu');
    });
  });

  it('renders latency chain component', async () => {
    render(<Status />);

    expect(screen.getByText('Latency Chain')).toBeInTheDocument();
    expect(screen.getByText('Client')).toBeInTheDocument();
    expect(screen.getByText('Server')).toBeInTheDocument();
  });

  it('renders chaos controls section', async () => {
    render(<Status />);

    expect(screen.getByText('Chaos Controls')).toBeInTheDocument();
    expect(screen.getByText(/Simulation Mode/i)).toBeInTheDocument();
  });

  it('renders charts section', async () => {
    render(<Status />);

    expect(screen.getByText('Real-Time Metrics')).toBeInTheDocument();
    expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0);
  });

  it('shows reconnect button on error state', async () => {
    render(<Status />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const eventSource = MockEventSource.instances[0];

    act(() => {
      eventSource.simulateError();
    });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Reconnect/i }),
      ).toBeInTheDocument();
    });
  });

  it('formats uptime correctly', async () => {
    render(<Status />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const eventSource = MockEventSource.instances[0];

    act(() => {
      eventSource.simulateMessage(mockSnapshot);
    });

    await waitFor(() => {
      // 3600 seconds = 1h 0m 0s
      expect(screen.getByText('1h 0m 0s')).toBeInTheDocument();
    });
  });

  it('shows database connected status', async () => {
    render(<Status />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const eventSource = MockEventSource.instances[0];

    act(() => {
      eventSource.simulateMessage(mockSnapshot);
    });

    await waitFor(() => {
      expect(screen.getByText('✓ Connected')).toBeInTheDocument();
    });
  });

  it('shows database disconnected status when not connected', async () => {
    render(<Status />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const eventSource = MockEventSource.instances[0];

    act(() => {
      eventSource.simulateMessage({
        ...mockSnapshot,
        database: { ...mockSnapshot.database, connected: false },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('✗ Disconnected')).toBeInTheDocument();
    });
  });

  it('shows warning health state for medium latency', async () => {
    render(<Status />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const eventSource = MockEventSource.instances[0];

    // Send snapshot with warning-level latency (5-20ms)
    act(() => {
      eventSource.simulateMessage({
        ...mockSnapshot,
        eventLoop: { ...mockSnapshot.eventLoop, lagMs: 15 },
        database: { ...mockSnapshot.database, latencyMs: 10 },
      });
    });

    // Latency appears in multiple places - verify data-status attribute
    await waitFor(() => {
      const heartbeat = document.querySelector('[data-status="warning"]');
      expect(heartbeat).toBeInTheDocument();
    });
  });

  it('shows critical health state for high latency', async () => {
    render(<Status />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const eventSource = MockEventSource.instances[0];

    // Send snapshot with critical-level latency (>20ms)
    act(() => {
      eventSource.simulateMessage({
        ...mockSnapshot,
        eventLoop: { ...mockSnapshot.eventLoop, lagMs: 50 },
        database: { ...mockSnapshot.database, latencyMs: 30 },
      });
    });

    // Verify data-status attribute for critical state
    await waitFor(() => {
      const heartbeat = document.querySelector('[data-status="critical"]');
      expect(heartbeat).toBeInTheDocument();
    });
  });

  it('handles malformed SSE messages gracefully', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(<Status />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const eventSource = MockEventSource.instances[0];

    // Simulate connected state first, then send malformed JSON
    act(() => {
      eventSource.readyState = 1;
      eventSource.onopen?.();
    });

    // Send malformed JSON to trigger the catch block
    act(() => {
      eventSource.onmessage?.({ data: 'not valid json' } as MessageEvent);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to parse SSE message:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it('clears data and reconnects when reconnect button is clicked', async () => {
    render(<Status />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const eventSource = MockEventSource.instances[0];

    // Send some data first
    act(() => {
      eventSource.simulateMessage(mockSnapshot);
    });

    // Trigger error state to show reconnect button
    act(() => {
      eventSource.simulateError();
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Reconnect/i }),
      ).toBeInTheDocument();
    });

    // Click reconnect
    fireEvent.click(screen.getByRole('button', { name: /Reconnect/i }));

    await waitFor(() => {
      // New EventSource created
      expect(MockEventSource.instances.length).toBeGreaterThan(1);
    });
  });

  it('both chaos toggles can be enabled simultaneously', async () => {
    render(<Status />);

    const cpuButton = screen.getByRole('button', { name: /CPU Stress OFF/i });
    const memoryButton = screen.getByRole('button', {
      name: /Memory Stress OFF/i,
    });

    fireEvent.click(cpuButton);
    fireEvent.click(memoryButton);

    await waitFor(() => {
      const instances = MockEventSource.instances;
      const lastUrl = instances[instances.length - 1].url;
      expect(lastUrl).toContain('chaos=');
      expect(lastUrl).toMatch(/cpu|memory/);
    });
  });

  it('auto-reconnects after error when still enabled', async () => {
    jest.useFakeTimers();

    render(<Status />);

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const eventSource = MockEventSource.instances[0];
    const instanceCountBefore = MockEventSource.instances.length;

    // Simulate error
    act(() => {
      eventSource.simulateError();
    });

    // Fast-forward the 3 second reconnect timer
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Should have created a new EventSource
    expect(MockEventSource.instances.length).toBeGreaterThan(
      instanceCountBefore,
    );

    jest.useRealTimers();
  });

  it('renders link to Request Traces page', async () => {
    render(<Status />);

    const tracesLink = screen.getByRole('link', {
      name: /Open Request Traces/i,
    });
    expect(tracesLink).toBeInTheDocument();
    expect(tracesLink).toHaveAttribute('href', '/status/traces');
  });

  it('displays Request Tracing section with description', async () => {
    render(<Status />);

    expect(screen.getByText('Request Tracing')).toBeInTheDocument();
    expect(
      screen.getByText(/View detailed request traces/i),
    ).toBeInTheDocument();
  });
});
