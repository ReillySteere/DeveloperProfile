import React from 'react';
import { render, screen, fireEvent, waitFor, act } from 'ui/test-utils';
import TracesContainer from './traces.container';
import TraceDetailContainer from './trace-detail.container';
import type {
  RequestTrace,
  TraceStats,
  TraceHourlyStats,
  TraceEndpointStats,
  AlertHistoryRecord,
} from 'shared/types';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock TanStack router hooks
const mockNavigate = jest.fn();
jest.mock('@tanstack/react-router', () => ({
  ...jest.requireActual('@tanstack/react-router'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ traceId: 'test-trace-123' }),
}));

// Mock EventSource for live streaming
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

beforeAll(() => {
  Object.defineProperty(global, 'EventSource', {
    writable: true,
    value: MockEventSource,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  MockEventSource.instances = [];
});

const mockTrace: RequestTrace = {
  traceId: 'test-trace-123',
  method: 'GET',
  path: '/api/test',
  statusCode: 200,
  durationMs: 45.5,
  timing: {
    middleware: 1,
    guard: 2,
    interceptorPre: 3,
    handler: 35,
    interceptorPost: 1,
  },
  userId: 1,
  userAgent: 'Mozilla/5.0',
  ip: '127.0.0.1',
  timestamp: '2025-01-23T12:00:00Z',
};

const mockStats: TraceStats = {
  totalCount: 100,
  avgDuration: 50.5,
  errorRate: 2.5,
};

const mockHourlyStats: TraceHourlyStats[] = [
  {
    hour: '2025-01-23T12:00:00.000Z',
    count: 10,
    avgDuration: 45,
    errorRate: 5,
    p95Duration: 100,
  },
  {
    hour: '2025-01-23T13:00:00.000Z',
    count: 15,
    avgDuration: 50,
    errorRate: 3,
    p95Duration: 120,
  },
];

const mockEndpointStats: TraceEndpointStats[] = [
  {
    path: '/api/test',
    method: 'GET',
    count: 50,
    avgDuration: 40,
    errorRate: 2,
  },
  {
    path: '/api/blog',
    method: 'GET',
    count: 30,
    avgDuration: 60,
    errorRate: 1,
  },
];

/**
 * Helper to create a mock implementation for axios.get that handles all trace endpoints.
 * Allows overriding specific responses.
 */
function createMockAxiosGet(
  overrides: {
    traces?: RequestTrace[];
    stats?: TraceStats;
    hourlyStats?: TraceHourlyStats[];
    endpointStats?: TraceEndpointStats[];
    alerts?: AlertHistoryRecord[];
  } = {},
) {
  const traces = overrides.traces ?? [mockTrace];
  const stats = overrides.stats ?? mockStats;
  const hourlyStats = overrides.hourlyStats ?? mockHourlyStats;
  const endpointStats = overrides.endpointStats ?? mockEndpointStats;
  const alerts = overrides.alerts ?? [];

  return (url: string) => {
    if (url.includes('/api/traces/alerts/unresolved')) {
      return Promise.resolve({ data: alerts });
    }
    if (url.includes('/api/traces/stats/hourly')) {
      return Promise.resolve({ data: hourlyStats });
    }
    if (url.includes('/api/traces/stats/endpoints')) {
      return Promise.resolve({ data: endpointStats });
    }
    if (url.includes('/api/traces/stats')) {
      return Promise.resolve({ data: stats });
    }
    if (url.includes('/api/traces')) {
      return Promise.resolve({ data: traces });
    }
    return Promise.reject(new Error('Not found'));
  };
}

describe('TracesContainer', () => {
  beforeEach(() => {
    mockAxios.get.mockImplementation(createMockAxiosGet());
  });

  it('should render the traces container', async () => {
    render(<TracesContainer />);

    expect(screen.getByText('Request Traces')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Loading traces...')).toBeInTheDocument();
    });
  });

  it('should display traces when loaded', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      // Use getAllByText since path appears in trace list and endpoint breakdown
      expect(screen.getAllByText('/api/test').length).toBeGreaterThanOrEqual(1);
    });

    // Check that status code from trace is visible
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('should display stats when loaded', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Total Traces (24h)')).toBeInTheDocument();
    });

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('51ms')).toBeInTheDocument(); // avgDuration rounded
    expect(screen.getByText('2.5%')).toBeInTheDocument();
  });

  it('should toggle live mode', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    const liveToggle = screen.getByRole('button', { pressed: false });
    await act(async () => {
      fireEvent.click(liveToggle);
    });

    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('should show error state', async () => {
    mockAxios.get.mockRejectedValue(new Error('Network error'));

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load traces/)).toBeInTheDocument();
    });
  });

  it('should show empty state when no traces', async () => {
    mockAxios.get.mockImplementation(createMockAxiosGet({ traces: [] }));

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText(/No traces found/)).toBeInTheDocument();
    });
  });

  it('should refresh traces when clicking refresh button', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('/api/test')).toBeInTheDocument();
    });

    const initialCallCount = mockAxios.get.mock.calls.length;

    const refreshButton = screen.getByText('Refresh');
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    // Axios should be called again for traces
    await waitFor(() => {
      expect(mockAxios.get.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should navigate to trace detail when clicking a trace', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getAllByText('/api/test').length).toBeGreaterThanOrEqual(1);
    });

    // Click the trace row (the one with role="button")
    const traceRows = document.querySelectorAll('[role="button"]');
    const traceRow = Array.from(traceRows).find((row) =>
      row.textContent?.includes('/api/test'),
    );
    if (traceRow) {
      await act(async () => {
        fireEvent.click(traceRow);
      });
    }

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/status/traces/$traceId',
        params: { traceId: 'test-trace-123' },
      }),
    );
  });

  it('should hide filters in live mode', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText(/method/i)).toBeInTheDocument();
    });

    const liveToggle = screen.getByRole('button', { pressed: false });
    await act(async () => {
      fireEvent.click(liveToggle);
    });

    // Filters should not be visible in live mode
    expect(screen.queryByLabelText(/method/i)).not.toBeInTheDocument();
  });

  it('should display live traces when streaming', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    const liveToggle = screen.getByRole('button', { pressed: false });
    await act(async () => {
      fireEvent.click(liveToggle);
    });

    // Simulate receiving a live trace
    const eventSource = MockEventSource.instances[0];
    if (eventSource) {
      await act(async () => {
        eventSource.simulateMessage({
          ...mockTrace,
          traceId: 'live-trace-456',
          path: '/api/live-request',
        });
      });
    }

    await waitFor(() => {
      expect(screen.getByText('/api/live-request')).toBeInTheDocument();
    });
  });

  it('should highlight error rate when above threshold', async () => {
    mockAxios.get.mockImplementation(
      createMockAxiosGet({ stats: { ...mockStats, errorRate: 10 } }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('10.0%')).toBeInTheDocument();
    });
  });

  it('should apply filters when clicking Apply', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText(/method/i)).toBeInTheDocument();
    });

    // Change method filter
    const methodSelect = screen.getByLabelText(/method/i);
    await act(async () => {
      fireEvent.change(methodSelect, { target: { value: 'POST' } });
    });

    // Change path filter
    const pathInput = screen.getByLabelText(/path/i);
    await act(async () => {
      fireEvent.change(pathInput, { target: { value: '/api/users' } });
    });

    // Change status filter
    const statusInput = screen.getByLabelText(/status/i);
    await act(async () => {
      fireEvent.change(statusInput, { target: { value: '404' } });
    });

    // Change limit filter
    const limitSelect = screen.getByLabelText(/limit/i);
    await act(async () => {
      fireEvent.change(limitSelect, { target: { value: '100' } });
    });

    const initialCallCount = mockAxios.get.mock.calls.length;

    // Click Apply button
    const applyButton = screen.getByText('Apply Filters');
    await act(async () => {
      fireEvent.click(applyButton);
    });

    // Verify API is called with filter params
    await waitFor(() => {
      const traceCalls = mockAxios.get.mock.calls.filter((call) =>
        call[0].includes('/api/traces?'),
      );
      expect(traceCalls.length).toBeGreaterThan(0);
      const lastCall = traceCalls[traceCalls.length - 1][0];
      expect(lastCall).toContain('method=POST');
      expect(lastCall).toContain('path=%2Fapi%2Fusers');
      expect(lastCall).toContain('statusCode=404');
      expect(lastCall).toContain('limit=100');
    });

    // Should switch to static mode (filters applied)
    expect(mockAxios.get.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('should reset filters when clicking Reset', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText(/method/i)).toBeInTheDocument();
    });

    // Set some filters first
    const methodSelect = screen.getByLabelText(/method/i);
    await act(async () => {
      fireEvent.change(methodSelect, { target: { value: 'DELETE' } });
    });

    const pathInput = screen.getByLabelText(/path/i);
    await act(async () => {
      fireEvent.change(pathInput, { target: { value: '/api/test' } });
    });

    // Click Reset button
    const resetButton = screen.getByText('Reset');
    await act(async () => {
      fireEvent.click(resetButton);
    });

    // Verify filters are reset
    expect(methodSelect).toHaveValue('');
    expect(pathInput).toHaveValue('');
  });

  it('should navigate to trace detail via keyboard Enter', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getAllByText('/api/test').length).toBeGreaterThanOrEqual(1);
    });

    // Get the trace row - it's the one with role="button"
    const traceRow = screen
      .getByRole('button', { name: /GET/i })
      .closest('[role="button"]');
    if (traceRow) {
      await act(async () => {
        fireEvent.keyDown(traceRow, { key: 'Enter' });
      });
    }

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/status/traces/$traceId',
        params: { traceId: 'test-trace-123' },
      }),
    );
  });

  it('should not navigate on non-Enter key', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getAllByText('/api/test').length).toBeGreaterThanOrEqual(1);
    });

    // Get the trace row - it's the one with role="button"
    const traceRow = screen
      .getByRole('button', { name: /GET/i })
      .closest('[role="button"]');
    if (traceRow) {
      await act(async () => {
        fireEvent.keyDown(traceRow, { key: 'Escape' });
      });
    }

    // Navigate should not have been called from keyDown (only from earlier click test)
    const keyboardNavigateCalls = mockNavigate.mock.calls.filter(
      (call) => call[0]?.params?.traceId === 'test-trace-123',
    );
    expect(keyboardNavigateCalls).toHaveLength(0);
  });

  it('should display trace with sub-millisecond duration', async () => {
    mockAxios.get.mockImplementation(
      createMockAxiosGet({ traces: [{ ...mockTrace, durationMs: 0.5 }] }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('<1ms')).toBeInTheDocument();
    });
  });

  it('should display trace with seconds duration', async () => {
    mockAxios.get.mockImplementation(
      createMockAxiosGet({ traces: [{ ...mockTrace, durationMs: 2500 }] }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('2.50s')).toBeInTheDocument();
    });
  });

  it('should display trace with 1xx status code', async () => {
    mockAxios.get.mockImplementation(
      createMockAxiosGet({
        traces: [{ ...mockTrace, statusCode: 101 }],
        stats: { ...mockStats, totalCount: 50 },
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('101')).toBeInTheDocument();
    });
  });

  it('should display trace with 3xx status code', async () => {
    mockAxios.get.mockImplementation(
      createMockAxiosGet({ traces: [{ ...mockTrace, statusCode: 301 }] }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('301')).toBeInTheDocument();
    });
  });

  it('should handle SSE parse error gracefully', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    const liveToggle = screen.getByRole('button', { pressed: false });
    await act(async () => {
      fireEvent.click(liveToggle);
    });

    // Simulate receiving invalid JSON
    const eventSource = MockEventSource.instances[0];
    if (eventSource && eventSource.onmessage) {
      await act(async () => {
        eventSource.onmessage?.({ data: 'invalid-json{' });
      });
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[useTraceStream] Failed to parse trace'),
      expect.anything(),
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle SSE connection error and reconnect', async () => {
    jest.useFakeTimers();

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    const liveToggle = screen.getByRole('button', { pressed: false });
    await act(async () => {
      fireEvent.click(liveToggle);
    });

    // Simulate connection error
    const eventSource = MockEventSource.instances[0];
    if (eventSource) {
      await act(async () => {
        eventSource.simulateError();
      });
    }

    // Advance timers to trigger reconnect
    await act(async () => {
      jest.advanceTimersByTime(3500);
    });

    // Should have created a new EventSource for reconnection
    expect(MockEventSource.instances.length).toBeGreaterThan(1);

    jest.useRealTimers();
  });
});

describe('TraceDetailContainer', () => {
  beforeEach(() => {
    mockAxios.get.mockResolvedValue({ data: mockTrace });
  });

  it('should render loading state', async () => {
    render(<TraceDetailContainer />);

    expect(screen.getByText('Loading trace details...')).toBeInTheDocument();
  });

  it('should display trace details when loaded', async () => {
    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('Trace Details')).toBeInTheDocument();
    });

    expect(screen.getByText('test-trace-123')).toBeInTheDocument();
    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('/api/test')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('45.5ms')).toBeInTheDocument();
  });

  it('should display request metadata', async () => {
    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('Request Metadata')).toBeInTheDocument();
    });

    expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
    expect(screen.getByText('Mozilla/5.0')).toBeInTheDocument();
  });

  it('should display timing waterfall', async () => {
    render(<TraceDetailContainer />);

    await waitFor(() => {
      // Use getAllByText since both h2 and title span have "Request Timeline"
      expect(screen.getAllByText('Request Timeline')).toHaveLength(2);
    });
  });

  it('should navigate back when clicking back button', async () => {
    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('← Back')).toBeInTheDocument();
    });

    const backButton = screen.getByText('← Back');
    await act(async () => {
      fireEvent.click(backButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/status/traces' });
  });

  it('should show error state when trace not found', async () => {
    mockAxios.get.mockRejectedValue(new Error('Trace not found'));

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load trace/)).toBeInTheDocument();
    });

    expect(screen.getByText('Back to Traces')).toBeInTheDocument();
  });

  it('should navigate back from error state', async () => {
    mockAxios.get.mockRejectedValue(new Error('Trace not found'));

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('Back to Traces')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back to Traces');
    await act(async () => {
      fireEvent.click(backButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/status/traces' });
  });

  it('should display user ID when present', async () => {
    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('User ID')).toBeInTheDocument();
    });

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should display trace without user ID', async () => {
    mockAxios.get.mockResolvedValue({
      data: { ...mockTrace, userId: undefined },
    });

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('Trace Details')).toBeInTheDocument();
    });

    expect(screen.queryByText('User ID')).not.toBeInTheDocument();
  });

  it('should display N/A for missing IP and user agent', async () => {
    mockAxios.get.mockResolvedValue({
      data: { ...mockTrace, ip: null, userAgent: null },
    });

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getAllByText('N/A')).toHaveLength(2);
    });
  });

  it('should render different status code colors', async () => {
    const traces = [
      { ...mockTrace, statusCode: 101 }, // 1xx - informational
      { ...mockTrace, statusCode: 201 },
      { ...mockTrace, statusCode: 301 },
      { ...mockTrace, statusCode: 404 },
      { ...mockTrace, statusCode: 500 },
    ];

    for (const trace of traces) {
      mockAxios.get.mockResolvedValue({ data: trace });
      const { unmount } = render(<TraceDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText(String(trace.statusCode))).toBeInTheDocument();
      });

      unmount();
    }
  });

  it('should render different method colors', async () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    for (const method of methods) {
      mockAxios.get.mockResolvedValue({ data: { ...mockTrace, method } });
      const { unmount } = render(<TraceDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText(method)).toBeInTheDocument();
      });

      unmount();
    }
  });

  it('should display expanded timing waterfall with slow phase highlighting', async () => {
    // Create a trace with a slow handler phase (>100ms threshold)
    const slowTrace = {
      ...mockTrace,
      durationMs: 250,
      timing: {
        middleware: 5,
        guard: 3,
        interceptorPre: 2,
        handler: 200, // > 100ms threshold = slow
        interceptorPost: 5,
      },
    };
    mockAxios.get.mockResolvedValue({ data: slowTrace });

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('Handler')).toBeInTheDocument();
    });

    // Should show "slow" badge for the slow phase in expanded mode
    expect(screen.getByText('slow')).toBeInTheDocument();
  });

  it('should show tooltip on hover in expanded timing waterfall', async () => {
    // Create a trace with meaningful phase durations for label display
    const largePhaseTrace = {
      ...mockTrace,
      durationMs: 100,
      timing: {
        middleware: 5,
        guard: 5,
        interceptorPre: 5,
        handler: 80, // 80% of total - should show percentage label
        interceptorPost: 5,
      },
    };
    mockAxios.get.mockResolvedValue({ data: largePhaseTrace });

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('Handler')).toBeInTheDocument();
    });

    // Hover over the handler segment to trigger tooltip
    const segments = document.querySelectorAll('[class*="segment"]');
    // Find the handler segment (should be the largest one)
    const handlerSegment = Array.from(segments).find((seg) =>
      seg.getAttribute('style')?.includes('80%'),
    );

    if (handlerSegment) {
      fireEvent.mouseEnter(handlerSegment);

      await waitFor(() => {
        // Tooltip should show percentage of total
        expect(screen.getByText('80.0% of total')).toBeInTheDocument();
      });

      fireEvent.mouseLeave(handlerSegment);
    }
  });
});

describe('AlertsPanel', () => {
  beforeEach(() => {
    mockAxios.get.mockImplementation(createMockAxiosGet({ alerts: [] }));
    mockAxios.post.mockResolvedValue({ data: { id: 1, resolved: true } });
  });

  it('should render loading state', async () => {
    // Make axios delay to show loading
    mockAxios.get.mockImplementation(() => new Promise(() => {}));

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
    });
  });

  it('should render empty state when no alerts', async () => {
    mockAxios.get.mockImplementation(createMockAxiosGet({ alerts: [] }));

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('No active alerts')).toBeInTheDocument();
    });

    // Should show checkmark in empty state
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('should render error state when alerts fetch fails', async () => {
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/traces/alerts')) {
        return Promise.reject(new Error('Network error'));
      }
      return createMockAxiosGet()(url);
    });

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load alerts')).toBeInTheDocument();
    });
  });

  it('should display unresolved alerts', async () => {
    const mockAlerts: AlertHistoryRecord[] = [
      {
        id: 1,
        ruleName: 'High Latency',
        metric: 'avgDuration',
        threshold: 500,
        actualValue: 750,
        triggeredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
        resolved: false,
        channels: ['log'],
      },
    ];

    mockAxios.get.mockImplementation(
      createMockAxiosGet({ alerts: mockAlerts }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('High Latency')).toBeInTheDocument();
    });

    // Should show metric and value
    expect(screen.getByText(/Avg Latency:/)).toBeInTheDocument();
    expect(screen.getByText(/750ms/)).toBeInTheDocument();
    expect(screen.getByText('(threshold: 500ms)')).toBeInTheDocument();

    // Should show badge with count
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should display multiple alerts', async () => {
    const mockAlerts: AlertHistoryRecord[] = [
      {
        id: 1,
        ruleName: 'High Latency',
        metric: 'avgDuration',
        threshold: 500,
        actualValue: 750,
        triggeredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        resolved: false,
        channels: ['log'],
      },
      {
        id: 2,
        ruleName: 'High Error Rate',
        metric: 'errorRate',
        threshold: 5,
        actualValue: 8.5,
        triggeredAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
        resolved: false,
        channels: ['log'],
      },
    ];

    mockAxios.get.mockImplementation(
      createMockAxiosGet({ alerts: mockAlerts }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('High Latency')).toBeInTheDocument();
      expect(screen.getByText('High Error Rate')).toBeInTheDocument();
    });

    // Badge should show 2
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should resolve an alert when clicking resolve button', async () => {
    const mockAlerts: AlertHistoryRecord[] = [
      {
        id: 1,
        ruleName: 'High Latency',
        metric: 'avgDuration',
        threshold: 500,
        actualValue: 750,
        triggeredAt: new Date().toISOString(),
        resolved: false,
        channels: ['log'],
      },
    ];

    mockAxios.get.mockImplementation(
      createMockAxiosGet({ alerts: mockAlerts }),
    );
    mockAxios.patch.mockResolvedValue({
      data: { ...mockAlerts[0], resolved: true },
    });

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Resolve')).toBeInTheDocument();
    });

    const resolveButton = screen.getByText('Resolve');
    await act(async () => {
      fireEvent.click(resolveButton);
    });

    await waitFor(() => {
      expect(mockAxios.patch).toHaveBeenCalledWith(
        '/api/traces/alerts/1/resolve',
        { notes: undefined },
      );
    });
  });

  it('should format time ago correctly for recent alerts', async () => {
    const mockAlerts: AlertHistoryRecord[] = [
      {
        id: 1,
        ruleName: 'High Latency',
        metric: 'avgDuration',
        threshold: 500,
        actualValue: 750,
        triggeredAt: new Date(Date.now() - 30 * 1000).toISOString(), // 30 seconds ago
        resolved: false,
        channels: ['log'],
      },
    ];

    mockAxios.get.mockImplementation(
      createMockAxiosGet({ alerts: mockAlerts }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('just now')).toBeInTheDocument();
    });
  });

  it('should format time ago correctly for hour-old alerts', async () => {
    const mockAlerts: AlertHistoryRecord[] = [
      {
        id: 1,
        ruleName: 'High Latency',
        metric: 'avgDuration',
        threshold: 500,
        actualValue: 750,
        triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        resolved: false,
        channels: ['log'],
      },
    ];

    mockAxios.get.mockImplementation(
      createMockAxiosGet({ alerts: mockAlerts }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('2h ago')).toBeInTheDocument();
    });
  });

  it('should format time ago correctly for day-old alerts', async () => {
    const mockAlerts: AlertHistoryRecord[] = [
      {
        id: 1,
        ruleName: 'High Latency',
        metric: 'avgDuration',
        threshold: 500,
        actualValue: 750,
        triggeredAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
        resolved: false,
        channels: ['log'],
      },
    ];

    mockAxios.get.mockImplementation(
      createMockAxiosGet({ alerts: mockAlerts }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('2d ago')).toBeInTheDocument();
    });
  });

  it('should format error rate metric correctly', async () => {
    const mockAlerts: AlertHistoryRecord[] = [
      {
        id: 1,
        ruleName: 'High Error Rate',
        metric: 'errorRate',
        threshold: 5,
        actualValue: 8.5,
        triggeredAt: new Date().toISOString(),
        resolved: false,
        channels: ['log'],
      },
    ];

    mockAxios.get.mockImplementation(
      createMockAxiosGet({ alerts: mockAlerts }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText(/Error Rate:/)).toBeInTheDocument();
      expect(screen.getByText(/8.5%/)).toBeInTheDocument();
      expect(screen.getByText('(threshold: 5.0%)')).toBeInTheDocument();
    });
  });

  it('should format p95 duration metric correctly', async () => {
    const mockAlerts: AlertHistoryRecord[] = [
      {
        id: 1,
        ruleName: 'P95 Latency Spike',
        metric: 'p95Duration',
        threshold: 1000,
        actualValue: 1500,
        triggeredAt: new Date().toISOString(),
        resolved: false,
        channels: ['log'],
      },
    ];

    mockAxios.get.mockImplementation(
      createMockAxiosGet({ alerts: mockAlerts }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText(/P95 Latency:/)).toBeInTheDocument();
      expect(screen.getByText(/1500ms/)).toBeInTheDocument();
    });
  });

  it('should format unknown metric correctly', async () => {
    const mockAlerts: AlertHistoryRecord[] = [
      {
        id: 1,
        ruleName: 'Custom Alert',
        metric: 'customMetric',
        threshold: 100,
        actualValue: 150,
        triggeredAt: new Date().toISOString(),
        resolved: false,
        channels: ['log'],
      },
    ];

    mockAxios.get.mockImplementation(
      createMockAxiosGet({ alerts: mockAlerts }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText(/customMetric:/)).toBeInTheDocument();
    });
  });
});

describe('TraceTrends', () => {
  it('should render loading state', async () => {
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/traces/stats/hourly')) {
        return new Promise(() => {}); // Never resolves
      }
      return createMockAxiosGet()(url);
    });

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Loading trends...')).toBeInTheDocument();
    });
  });

  it('should render error state when fetch fails', async () => {
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/traces/stats/hourly')) {
        return Promise.reject(new Error('Network error'));
      }
      return createMockAxiosGet()(url);
    });

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load trends')).toBeInTheDocument();
    });
  });

  it('should render empty state when no data', async () => {
    mockAxios.get.mockImplementation(createMockAxiosGet({ hourlyStats: [] }));

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('No data available yet')).toBeInTheDocument();
    });
  });

  it('should render chart with data', async () => {
    mockAxios.get.mockImplementation(createMockAxiosGet());

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Request Trends (Last 24h)')).toBeInTheDocument();
    });
  });
});

describe('EndpointBreakdown', () => {
  it('should render loading state', async () => {
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/traces/stats/endpoints')) {
        return new Promise(() => {}); // Never resolves
      }
      return createMockAxiosGet()(url);
    });

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Loading endpoints...')).toBeInTheDocument();
    });
  });

  it('should render error state when fetch fails', async () => {
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/traces/stats/endpoints')) {
        return Promise.reject(new Error('Network error'));
      }
      return createMockAxiosGet()(url);
    });

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load endpoints')).toBeInTheDocument();
    });
  });

  it('should render empty state when no data', async () => {
    mockAxios.get.mockImplementation(createMockAxiosGet({ endpointStats: [] }));

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('No endpoint data yet')).toBeInTheDocument();
    });
  });

  it('should render endpoint table with data', async () => {
    mockAxios.get.mockImplementation(createMockAxiosGet());

    render(<TracesContainer />);

    // Wait for endpoints to load and verify data
    await waitFor(() => {
      expect(screen.getByText('/api/test')).toBeInTheDocument();
      expect(screen.getByText('/api/blog')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('40ms')).toBeInTheDocument();
    });
  });

  it('should display endpoint with slow latency', async () => {
    mockAxios.get.mockImplementation(
      createMockAxiosGet({
        endpointStats: [
          {
            path: '/api/slow',
            method: 'GET',
            count: 10,
            avgDuration: 600, // > 500ms threshold
            errorRate: 0,
          },
        ],
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('/api/slow')).toBeInTheDocument();
      expect(screen.getByText('600ms')).toBeInTheDocument();
    });
  });

  it('should display endpoint with high error rate', async () => {
    mockAxios.get.mockImplementation(
      createMockAxiosGet({
        endpointStats: [
          {
            path: '/api/errors',
            method: 'POST',
            count: 10,
            avgDuration: 50,
            errorRate: 15, // > 5% threshold
          },
        ],
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('/api/errors')).toBeInTheDocument();
      // Check that the errorHigh class is applied for high error rates
      const errorElement = screen.getByText(/15\.0/i);
      expect(errorElement).toHaveClass('errorHigh');
    });
  });

  it('should display endpoint with sub-millisecond latency', async () => {
    mockAxios.get.mockImplementation(
      createMockAxiosGet({
        endpointStats: [
          {
            path: '/api/fast',
            method: 'GET',
            count: 100,
            avgDuration: 0.5,
            errorRate: 0,
          },
        ],
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('/api/fast')).toBeInTheDocument();
      expect(screen.getByText('<1ms')).toBeInTheDocument();
    });
  });

  it('should display endpoint with seconds latency', async () => {
    mockAxios.get.mockImplementation(
      createMockAxiosGet({
        endpointStats: [
          {
            path: '/api/very-slow',
            method: 'GET',
            count: 5,
            avgDuration: 2500,
            errorRate: 0,
          },
        ],
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('/api/very-slow')).toBeInTheDocument();
      expect(screen.getByText('2.50s')).toBeInTheDocument();
    });
  });

  it('should display endpoints with different HTTP methods', async () => {
    mockAxios.get.mockImplementation(
      createMockAxiosGet({
        endpointStats: [
          {
            path: '/api/get',
            method: 'GET',
            count: 10,
            avgDuration: 50,
            errorRate: 0,
          },
          {
            path: '/api/post',
            method: 'POST',
            count: 10,
            avgDuration: 50,
            errorRate: 0,
          },
          {
            path: '/api/put',
            method: 'PUT',
            count: 10,
            avgDuration: 50,
            errorRate: 0,
          },
          {
            path: '/api/patch',
            method: 'PATCH',
            count: 10,
            avgDuration: 50,
            errorRate: 0,
          },
          {
            path: '/api/delete',
            method: 'DELETE',
            count: 10,
            avgDuration: 50,
            errorRate: 0,
          },
        ],
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('PUT')).toBeInTheDocument();
      expect(screen.getByText('PATCH')).toBeInTheDocument();
      expect(screen.getByText('DELETE')).toBeInTheDocument();
    });
  });
});

describe('TraceFilters', () => {
  beforeEach(() => {
    mockAxios.get.mockImplementation(createMockAxiosGet());
  });

  it('should apply duration filter presets', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Min Duration/i)).toBeInTheDocument();
    });

    // Set min duration
    const minDurationInput = screen.getByLabelText(/Min Duration/i);
    await act(async () => {
      fireEvent.change(minDurationInput, { target: { value: '100' } });
    });

    // Set max duration
    const maxDurationInput = screen.getByLabelText(/Max Duration/i);
    await act(async () => {
      fireEvent.change(maxDurationInput, { target: { value: '500' } });
    });

    // Apply filters
    const applyButton = screen.getByText('Apply Filters');
    await act(async () => {
      fireEvent.click(applyButton);
    });

    await waitFor(() => {
      const traceCalls = mockAxios.get.mock.calls.filter((call) =>
        call[0].includes('/api/traces?'),
      );
      expect(traceCalls.length).toBeGreaterThan(0);
      const lastCall = traceCalls[traceCalls.length - 1][0];
      expect(lastCall).toContain('minDuration=100');
      expect(lastCall).toContain('maxDuration=500');
    });
  });

  it('should use quick preset for slow requests', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Slow (>100ms)')).toBeInTheDocument();
    });

    // Click the slow requests preset
    const slowButton = screen.getByText('Slow (>100ms)');
    await act(async () => {
      fireEvent.click(slowButton);
    });

    // Verify the min duration input was updated
    await waitFor(() => {
      const minDurationInput = screen.getByLabelText(/Min Duration/i);
      expect(minDurationInput).toHaveValue(100);
    });
  });

  it('should use quick preset for fast requests', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Fast (<50ms)')).toBeInTheDocument();
    });

    // Click the fast requests preset
    const fastButton = screen.getByText('Fast (<50ms)');
    await act(async () => {
      fireEvent.click(fastButton);
    });

    // Verify the max duration input was updated
    await waitFor(() => {
      const maxDurationInput = screen.getByLabelText(/Max Duration/i);
      expect(maxDurationInput).toHaveValue(50);
    });
  });
});
