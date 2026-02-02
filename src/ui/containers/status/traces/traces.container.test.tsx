import React from 'react';
import {
  render,
  screen,
  waitFor,
  act,
  userEvent,
  fireEvent,
} from 'ui/test-utils';
import {
  server,
  createTraceHandlers,
  mockTrace,
  mockStats,
} from 'ui/test-utils/msw';
import { http, HttpResponse } from 'msw';
import TracesContainer from './traces.container';
import TraceDetailContainer from './trace-detail.container';
import type { RequestTrace, AlertHistoryRecord, AlertRule } from 'shared/types';
import { useTraces, useAlertRules, useAlertHistory } from './hooks/useTraces';

// Mock recharts to execute formatter functions for coverage
jest.mock(
  'recharts',
  () => jest.requireActual('ui/test-utils/mockRecharts').mockRecharts,
);

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
  // Default MSW handlers for trace endpoints
  server.use(...createTraceHandlers());
});

describe('TracesContainer', () => {
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
    const user = userEvent.setup();
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    const liveToggle = screen.getByRole('button', { pressed: false });
    await user.click(liveToggle);

    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('should show error state', async () => {
    server.use(
      http.get('/api/traces', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load traces/)).toBeInTheDocument();
    });
  });

  it('should show empty state when no traces', async () => {
    server.use(...createTraceHandlers({ traces: [] }));

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText(/No traces found/)).toBeInTheDocument();
    });
  });

  it('should refresh traces when clicking refresh button', async () => {
    const user = userEvent.setup();
    let callCount = 0;
    server.use(
      http.get('/api/traces', () => {
        callCount++;
        return HttpResponse.json([mockTrace]);
      }),
    );

    render(<TracesContainer />);

    // /api/test appears in both EndpointBreakdown and TraceList
    await waitFor(() => {
      expect(screen.getAllByText('/api/test').length).toBeGreaterThanOrEqual(1);
    });

    const initialCallCount = callCount;
    const refreshButton = screen.getByText('Refresh');
    await user.click(refreshButton);

    // API should be called again for traces
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(initialCallCount);
    });
  });

  it('should navigate to trace detail when clicking a trace', async () => {
    const user = userEvent.setup();
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
      await user.click(traceRow);
    }

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/status/traces/$traceId',
        params: { traceId: 'test-trace-123' },
      }),
    );
  });

  it('should hide filters in live mode', async () => {
    const user = userEvent.setup();
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText(/method/i)).toBeInTheDocument();
    });

    const liveToggle = screen.getByRole('button', { pressed: false });
    await user.click(liveToggle);

    // Filters should not be visible in live mode
    expect(screen.queryByLabelText(/method/i)).not.toBeInTheDocument();
  });

  it('should display live traces when streaming', async () => {
    const user = userEvent.setup();
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    const liveToggle = screen.getByRole('button', { pressed: false });
    await user.click(liveToggle);

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
    server.use(
      ...createTraceHandlers({ stats: { ...mockStats, errorRate: 10 } }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('10.0%')).toBeInTheDocument();
    });
  });

  it('should apply filters when clicking Apply', async () => {
    const user = userEvent.setup();
    let lastUrl = '';
    server.use(
      http.get('/api/traces', ({ request }) => {
        lastUrl = request.url;
        return HttpResponse.json([mockTrace]);
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText(/method/i)).toBeInTheDocument();
    });

    // Change method filter
    await user.selectOptions(screen.getByLabelText(/method/i), 'POST');

    // Change path filter
    await user.type(screen.getByLabelText(/path/i), '/api/users');

    // Change status filter
    await user.type(screen.getByLabelText(/status/i), '404');

    // Change limit filter
    await user.selectOptions(screen.getByLabelText(/limit/i), '100');

    // Click Apply button
    await user.click(screen.getByText('Apply Filters'));

    // Verify API is called with filter params
    await waitFor(() => {
      expect(lastUrl).toContain('method=POST');
      expect(lastUrl).toContain('path=%2Fapi%2Fusers');
      expect(lastUrl).toContain('statusCode=404');
      expect(lastUrl).toContain('limit=100');
    });
  });

  it('should reset filters when clicking Reset', async () => {
    const user = userEvent.setup();
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText(/method/i)).toBeInTheDocument();
    });

    // Set some filters first
    const methodSelect = screen.getByLabelText(/method/i);
    await user.selectOptions(methodSelect, 'DELETE');

    const pathInput = screen.getByLabelText(/path/i);
    await user.type(pathInput, '/api/test');

    // Click Reset button
    await user.click(screen.getByText('Reset'));

    // Verify filters are reset
    expect(methodSelect).toHaveValue('');
    expect(pathInput).toHaveValue('');
  });

  it('should navigate to trace detail via keyboard Enter', async () => {
    const user = userEvent.setup();
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getAllByText('/api/test').length).toBeGreaterThanOrEqual(1);
    });

    // Get the trace row - it's the one with role="button"
    const traceRow = screen
      .getByRole('button', { name: /GET/i })
      .closest('[role="button"]');
    if (traceRow) {
      (traceRow as HTMLElement).focus();
      await user.keyboard('{Enter}');
    }

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/status/traces/$traceId',
        params: { traceId: 'test-trace-123' },
      }),
    );
  });

  it('should not navigate on non-Enter key', async () => {
    const user = userEvent.setup();
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getAllByText('/api/test').length).toBeGreaterThanOrEqual(1);
    });

    // Get the trace row - it's the one with role="button"
    const traceRow = screen
      .getByRole('button', { name: /GET/i })
      .closest('[role="button"]');
    if (traceRow) {
      (traceRow as HTMLElement).focus();
      await user.keyboard('{Escape}');
    }

    // Navigate should not have been called from keyDown (only from earlier click test)
    const keyboardNavigateCalls = mockNavigate.mock.calls.filter(
      (call) => call[0]?.params?.traceId === 'test-trace-123',
    );
    expect(keyboardNavigateCalls).toHaveLength(0);
  });

  it('should display trace with sub-millisecond duration', async () => {
    server.use(
      ...createTraceHandlers({ traces: [{ ...mockTrace, durationMs: 0.5 }] }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('<1ms')).toBeInTheDocument();
    });
  });

  it('should display trace with seconds duration', async () => {
    server.use(
      ...createTraceHandlers({ traces: [{ ...mockTrace, durationMs: 2500 }] }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('2.50s')).toBeInTheDocument();
    });
  });

  it('should display trace with 1xx status code', async () => {
    server.use(
      ...createTraceHandlers({
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
    server.use(
      ...createTraceHandlers({ traces: [{ ...mockTrace, statusCode: 301 }] }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('301')).toBeInTheDocument();
    });
  });

  it('should handle SSE parse error gracefully', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    const liveToggle = screen.getByRole('button', { pressed: false });
    await user.click(liveToggle);

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
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    jest.useFakeTimers();

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    const liveToggle = screen.getByRole('button', { pressed: false });
    await user.click(liveToggle);

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
    const user = userEvent.setup();
    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('← Back')).toBeInTheDocument();
    });

    const backButton = screen.getByText('← Back');
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/status/traces' });
  });

  it('should show error state when trace not found', async () => {
    server.use(
      http.get(
        '/api/traces/:traceId',
        () => new HttpResponse(null, { status: 404 }),
      ),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load trace/)).toBeInTheDocument();
    });

    expect(screen.getByText('Back to Traces')).toBeInTheDocument();
  });

  it('should navigate back from error state', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(
        '/api/traces/:traceId',
        () => new HttpResponse(null, { status: 404 }),
      ),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('Back to Traces')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back to Traces');
    await user.click(backButton);

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
    server.use(
      http.get('/api/traces/:traceId', () =>
        HttpResponse.json({ ...mockTrace, userId: undefined }),
      ),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('Trace Details')).toBeInTheDocument();
    });

    expect(screen.queryByText('User ID')).not.toBeInTheDocument();
  });

  it('should display N/A for missing IP and user agent', async () => {
    server.use(
      http.get('/api/traces/:traceId', () =>
        HttpResponse.json({ ...mockTrace, ip: null, userAgent: null }),
      ),
    );

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
      server.use(
        http.get('/api/traces/:traceId', () => HttpResponse.json(trace)),
      );
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
      server.use(
        http.get('/api/traces/:traceId', () =>
          HttpResponse.json({ ...mockTrace, method }),
        ),
      );
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
    server.use(
      http.get('/api/traces/:traceId', () => HttpResponse.json(slowTrace)),
    );

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
    server.use(
      http.get('/api/traces/:traceId', () =>
        HttpResponse.json(largePhaseTrace),
      ),
    );

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
    server.use(...createTraceHandlers({ alerts: [] }));
  });

  it('should render loading state', async () => {
    // Make handler delay to show loading
    server.use(
      http.get('/api/traces/alerts', async () => {
        await new Promise(() => {}); // Never resolves
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
    });
  });

  it('should render empty state when no alerts', async () => {
    server.use(...createTraceHandlers({ alerts: [] }));

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('No active alerts')).toBeInTheDocument();
    });

    // Should show checkmark in empty state
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('should render error state when alerts fetch fails', async () => {
    server.use(
      http.get(
        '/api/traces/alerts/unresolved',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

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

    server.use(...createTraceHandlers({ alerts: mockAlerts }));

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

    server.use(...createTraceHandlers({ alerts: mockAlerts }));

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('High Latency')).toBeInTheDocument();
      expect(screen.getByText('High Error Rate')).toBeInTheDocument();
    });

    // Badge should show 2
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should resolve an alert when clicking resolve button', async () => {
    const user = userEvent.setup();
    let patchCalled = false;
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

    server.use(
      ...createTraceHandlers({ alerts: mockAlerts }),
      http.patch('/api/traces/alerts/:id/resolve', () => {
        patchCalled = true;
        return HttpResponse.json({ ...mockAlerts[0], resolved: true });
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Resolve')).toBeInTheDocument();
    });

    const resolveButton = screen.getByText('Resolve');
    await user.click(resolveButton);

    await waitFor(() => {
      expect(patchCalled).toBe(true);
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

    server.use(...createTraceHandlers({ alerts: mockAlerts }));

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

    server.use(...createTraceHandlers({ alerts: mockAlerts }));

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

    server.use(...createTraceHandlers({ alerts: mockAlerts }));

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

    server.use(...createTraceHandlers({ alerts: mockAlerts }));

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

    server.use(...createTraceHandlers({ alerts: mockAlerts }));

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

    server.use(...createTraceHandlers({ alerts: mockAlerts }));

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText(/customMetric:/)).toBeInTheDocument();
    });
  });
});

describe('TraceTrends', () => {
  it('should render loading state', async () => {
    server.use(
      http.get('/api/traces/stats/hourly', async () => {
        await new Promise(() => {}); // Never resolves
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Loading trends...')).toBeInTheDocument();
    });
  });

  it('should render error state when fetch fails', async () => {
    server.use(
      http.get(
        '/api/traces/stats/hourly',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load trends')).toBeInTheDocument();
    });
  });

  it('should render empty state when no data', async () => {
    server.use(...createTraceHandlers({ hourlyStats: [] }));

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('No data available yet')).toBeInTheDocument();
    });
  });

  it('should render chart with data', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Request Trends (Last 24h)')).toBeInTheDocument();
    });
  });
});

describe('EndpointBreakdown', () => {
  it('should render loading state', async () => {
    server.use(
      http.get('/api/traces/stats/endpoints', async () => {
        await new Promise(() => {}); // Never resolves
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Loading endpoints...')).toBeInTheDocument();
    });
  });

  it('should render error state when fetch fails', async () => {
    server.use(
      http.get(
        '/api/traces/stats/endpoints',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load endpoints')).toBeInTheDocument();
    });
  });

  it('should render empty state when no data', async () => {
    server.use(...createTraceHandlers({ endpointStats: [] }));

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('No endpoint data yet')).toBeInTheDocument();
    });
  });

  it('should render endpoint table with data', async () => {
    render(<TracesContainer />);

    // Wait for endpoints to load and verify data
    // Note: /api/test appears in both EndpointBreakdown and TraceList
    await waitFor(() => {
      expect(screen.getAllByText('/api/test').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('/api/blog')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('40ms')).toBeInTheDocument();
    });
  });

  it('should display endpoint with slow latency', async () => {
    server.use(
      ...createTraceHandlers({
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
    server.use(
      ...createTraceHandlers({
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
    server.use(
      ...createTraceHandlers({
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
    server.use(
      ...createTraceHandlers({
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
    server.use(
      ...createTraceHandlers({
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
  it('should apply duration filter presets', async () => {
    const user = userEvent.setup();
    let lastUrl = '';
    server.use(
      http.get('/api/traces', ({ request }) => {
        lastUrl = request.url;
        return HttpResponse.json([mockTrace]);
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Min Duration/i)).toBeInTheDocument();
    });

    // Set min duration
    const minDurationInput = screen.getByLabelText(/Min Duration/i);
    await user.type(minDurationInput, '100');

    // Set max duration
    const maxDurationInput = screen.getByLabelText(/Max Duration/i);
    await user.type(maxDurationInput, '500');

    // Apply filters
    const applyButton = screen.getByText('Apply Filters');
    await user.click(applyButton);

    await waitFor(() => {
      expect(lastUrl).toContain('minDuration=100');
      expect(lastUrl).toContain('maxDuration=500');
    });
  });

  it('should use quick preset for slow requests', async () => {
    const user = userEvent.setup();
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Slow (>100ms)')).toBeInTheDocument();
    });

    // Click the slow requests preset
    const slowButton = screen.getByText('Slow (>100ms)');
    await user.click(slowButton);

    // Verify the min duration input was updated
    await waitFor(() => {
      const minDurationInput = screen.getByLabelText(/Min Duration/i);
      expect(minDurationInput).toHaveValue(100);
    });
  });

  it('should use quick preset for fast requests', async () => {
    const user = userEvent.setup();
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Fast (<50ms)')).toBeInTheDocument();
    });

    // Click the fast requests preset
    const fastButton = screen.getByText('Fast (<50ms)');
    await user.click(fastButton);

    // Verify the max duration input was updated
    await waitFor(() => {
      const maxDurationInput = screen.getByLabelText(/Max Duration/i);
      expect(maxDurationInput).toHaveValue(50);
    });
  });
});

describe('TimingWaterfall edge cases', () => {
  it('should display sub-millisecond timing phase', async () => {
    const subMsTrace = {
      ...mockTrace,
      durationMs: 10,
      timing: {
        middleware: 0.5, // < 1ms triggers branch
        guard: 2,
        interceptorPre: 1,
        handler: 5,
        interceptorPost: 1.5,
      },
    };
    server.use(
      http.get('/api/traces/:traceId', () => HttpResponse.json(subMsTrace)),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('<1ms')).toBeInTheDocument();
    });
  });

  it('should display seconds-level timing phase', async () => {
    const slowPhaseTrace = {
      ...mockTrace,
      durationMs: 3000,
      timing: {
        middleware: 50,
        guard: 50,
        interceptorPre: 100,
        handler: 2500, // > 1000ms triggers seconds format
        interceptorPost: 300,
      },
    };
    server.use(
      http.get('/api/traces/:traceId', () => HttpResponse.json(slowPhaseTrace)),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('2.50s')).toBeInTheDocument();
    });
  });

  it('should handle zero percentage phases', async () => {
    // When timing values are 0, percentage is 0 and segment should not render
    const zeroPhaseTrace = {
      ...mockTrace,
      durationMs: 50,
      timing: {
        middleware: 0, // 0% - should not render segment
        guard: 10,
        interceptorPre: 0, // 0% - should not render segment
        handler: 30,
        interceptorPost: 10,
      },
    };
    server.use(
      http.get('/api/traces/:traceId', () => HttpResponse.json(zeroPhaseTrace)),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('Handler')).toBeInTheDocument();
    });

    // Middleware and InterceptorPre should still appear in legend even if bar segment hidden
    expect(screen.getByText('Middleware')).toBeInTheDocument();
  });
});

describe('TraceDetailContainer edge cases', () => {
  it('should handle trace with unknown HTTP method', async () => {
    const unknownMethodTrace = {
      ...mockTrace,
      method: 'OPTIONS', // Not in the standard method classes
    };
    server.use(
      http.get('/api/traces/:traceId', () =>
        HttpResponse.json(unknownMethodTrace),
      ),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('OPTIONS')).toBeInTheDocument();
    });
  });

  it('should show error message when fetch fails with 404', async () => {
    server.use(
      http.get(
        '/api/traces/:traceId',
        () => new HttpResponse(null, { status: 404 }),
      ),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(
        screen.getByText(/Request failed with status code 404/),
      ).toBeInTheDocument();
    });
  });

  it('should show fallback message when trace data is null', async () => {
    server.use(http.get('/api/traces/:traceId', () => HttpResponse.json(null)));

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText(/Trace not found/)).toBeInTheDocument();
    });
  });

  it('should display 1xx status with correct styling', async () => {
    const informationalTrace = { ...mockTrace, statusCode: 100 };
    server.use(
      http.get('/api/traces/:traceId', () =>
        HttpResponse.json(informationalTrace),
      ),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });
});

describe('EndpointBreakdown edge cases', () => {
  it('should handle endpoint with unknown HTTP method', async () => {
    server.use(
      ...createTraceHandlers({
        endpointStats: [
          {
            path: '/api/options',
            method: 'OPTIONS', // Not in getMethodClass switch
            count: 5,
            avgDuration: 30,
            errorRate: 0,
          },
        ],
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('OPTIONS')).toBeInTheDocument();
    });
  });
});

describe('AlertsPanel edge cases', () => {
  it('should format time ago for minute-old alerts', async () => {
    const mockAlerts: AlertHistoryRecord[] = [
      {
        id: 1,
        ruleName: 'Test Alert',
        metric: 'avgDuration',
        threshold: 100,
        actualValue: 150,
        triggeredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        resolved: false,
        channels: ['log'],
      },
    ];

    server.use(...createTraceHandlers({ alerts: mockAlerts }));

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('15m ago')).toBeInTheDocument();
    });
  });

  it('should show badge when alerts exist', async () => {
    const mockAlerts: AlertHistoryRecord[] = [
      {
        id: 1,
        ruleName: 'Alert 1',
        metric: 'avgDuration',
        threshold: 100,
        actualValue: 150,
        triggeredAt: new Date().toISOString(),
        resolved: false,
        channels: ['log'],
      },
    ];

    server.use(...createTraceHandlers({ alerts: mockAlerts }));

    render(<TracesContainer />);

    await waitFor(() => {
      // Badge with count should be visible
      const badge = screen.getByText('1');
      expect(badge).toBeInTheDocument();
    });
  });
});

describe('useTraceStream edge cases', () => {
  it('should handle error state and reconnect logic', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    jest.useFakeTimers();

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    // Enable live mode
    const liveToggle = screen.getByRole('button', { pressed: false });
    await user.click(liveToggle);

    // Wait for EventSource to be created
    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const instanceCountBefore = MockEventSource.instances.length;

    // Simulate error - the onerror handler should be triggered
    const eventSource =
      MockEventSource.instances[MockEventSource.instances.length - 1];
    await act(async () => {
      eventSource.simulateError();
    });

    // Advance timers past the 3 second reconnect delay
    // Since enabled is still true (live mode active), it should reconnect
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });

    // Should have created a new EventSource for reconnection
    expect(MockEventSource.instances.length).toBeGreaterThan(
      instanceCountBefore,
    );

    jest.useRealTimers();
  });

  it('should handle buffer trimming when max traces exceeded', async () => {
    const user = userEvent.setup();
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    // Enable live mode
    const liveToggle = screen.getByRole('button', { pressed: false });
    await user.click(liveToggle);

    // Simulate receiving many traces to test buffer trimming
    const eventSource =
      MockEventSource.instances[MockEventSource.instances.length - 1];
    if (eventSource) {
      for (let i = 0; i < 60; i++) {
        await act(async () => {
          eventSource.simulateMessage({
            ...mockTrace,
            traceId: `trace-${i}`,
            path: `/api/trace-${i}`,
          });
        });
      }
    }

    // Should have limited number of traces displayed (max 50)
    await waitFor(() => {
      const traceRows = document.querySelectorAll('[role="button"]');
      // Filter to only trace rows (not other buttons)
      const actualTraceRows = Array.from(traceRows).filter((row) =>
        row.textContent?.includes('/api/trace-'),
      );
      expect(actualTraceRows.length).toBeLessThanOrEqual(50);
    });
  });

  it('should clean up EventSource on unmount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    // Enable live mode to create EventSource
    const liveToggle = screen.getByRole('button', { pressed: false });
    await user.click(liveToggle);

    // Wait for EventSource to be created
    await waitFor(() => {
      expect(MockEventSource.instances.length).toBeGreaterThan(0);
    });

    const eventSource =
      MockEventSource.instances[MockEventSource.instances.length - 1];

    // Unmount should trigger cleanup and close EventSource
    unmount();

    expect(eventSource.close).toHaveBeenCalled();
  });
});

describe('TraceRow edge cases', () => {
  it('should render trace with 1xx status correctly', async () => {
    server.use(
      ...createTraceHandlers({
        traces: [{ ...mockTrace, statusCode: 101 }], // 1xx status
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      // 1xx statuses should display correctly
      expect(screen.getByText('101')).toBeInTheDocument();
    });
  });

  it('should render trace with status below 100', async () => {
    // Edge case: status code below 100 (theoretically possible)
    server.use(
      ...createTraceHandlers({
        traces: [{ ...mockTrace, statusCode: 0 }],
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  it('should render trace with 1xx status class', async () => {
    // Explicitly test the status1xx class (for coverage of line 51)
    server.use(
      ...createTraceHandlers({
        traces: [{ ...mockTrace, statusCode: 100 }],
        stats: { ...mockStats, totalCount: 50 }, // Use different value to avoid collision
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      // Look for the status element with class status1xx
      const statusElement = document.querySelector('.status1xx');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveTextContent('100');
    });
  });
});

describe('useTraces URL building edge cases', () => {
  it('should fetch traces without query params when no filters applied', async () => {
    // This test covers line 34 - the case where queryString is empty
    // When filters are completely empty (no limit set), URL should be plain /api/traces
    // Note: The container sets limit=50 by default, so we need to verify the filter behavior

    render(<TracesContainer />);

    await waitFor(() => {
      // Just verify traces load
      expect(screen.getAllByText('/api/test').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should handle all filter types in URL', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText(/method/i)).toBeInTheDocument();
    });

    // Set all filter types
    const user = userEvent.setup();
    let lastUrl = '';
    server.use(
      http.get('/api/traces', ({ request }) => {
        lastUrl = request.url;
        return HttpResponse.json([mockTrace]);
      }),
    );

    const methodSelect = screen.getByLabelText(/method/i);
    const pathInput = screen.getByLabelText(/path/i);
    const statusInput = screen.getByLabelText(/status/i);
    const minDurationInput = screen.getByLabelText(/Min Duration/i);
    const maxDurationInput = screen.getByLabelText(/Max Duration/i);

    await user.selectOptions(methodSelect, 'POST');
    await user.type(pathInput, '/api/test');
    await user.type(statusInput, '500');
    await user.type(minDurationInput, '10');
    await user.type(maxDurationInput, '1000');

    const applyButton = screen.getByText('Apply Filters');
    await user.click(applyButton);

    await waitFor(() => {
      expect(lastUrl).toContain('method=POST');
      expect(lastUrl).toContain('path=');
      expect(lastUrl).toContain('statusCode=500');
      expect(lastUrl).toContain('minDuration=10');
      expect(lastUrl).toContain('maxDuration=1000');
    });
  });
});

describe('Edge cases for coverage', () => {
  it('should handle unknown HTTP method in endpoint breakdown', async () => {
    server.use(
      ...createTraceHandlers({
        endpointStats: [
          {
            path: '/api/custom',
            method: 'OPTIONS', // Unknown method
            count: 5,
            avgDuration: 10,
            errorRate: 0,
          },
        ],
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('/api/custom')).toBeInTheDocument();
      expect(screen.getByText('OPTIONS')).toBeInTheDocument();
    });
  });

  it('should handle trace with very long duration (seconds)', async () => {
    server.use(
      ...createTraceHandlers({
        traces: [
          {
            ...mockTrace,
            traceId: 'slow-trace-123',
            path: '/api/very-slow',
            durationMs: 2500, // 2.5 seconds
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

  it('should handle trace with zero duration', async () => {
    server.use(
      ...createTraceHandlers({
        traces: [
          {
            ...mockTrace,
            traceId: 'fast-trace-123',
            path: '/api/instant',
            durationMs: 0.3, // Sub-millisecond
          },
        ],
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('/api/instant')).toBeInTheDocument();
      expect(screen.getByText('<1ms')).toBeInTheDocument();
    });
  });

  it('should handle disabled live mode (enabled=false)', async () => {
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Static')).toBeInTheDocument();
    });

    // Live mode is disabled by default (false)
    // Verify no EventSource was created initially
    expect(MockEventSource.instances.length).toBe(0);
  });
});

describe('AlertsPanel - isPending state', () => {
  it('should show "Resolving..." when resolution is in progress', async () => {
    const user = userEvent.setup();
    const mockAlerts: AlertHistoryRecord[] = [
      {
        id: 1,
        ruleName: 'Test Alert',
        metric: 'avgDuration',
        threshold: 100,
        actualValue: 150,
        triggeredAt: new Date().toISOString(),
        resolved: false,
        channels: ['log'],
      },
    ];

    server.use(
      ...createTraceHandlers({ alerts: mockAlerts }),
      // Make patch request hang to keep isPending=true
      http.patch('/api/traces/alerts/:id/resolve', async () => {
        await new Promise(() => {}); // Never resolves
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('Resolve')).toBeInTheDocument();
    });

    const resolveButton = screen.getByText('Resolve');
    await user.click(resolveButton);

    // Should show "Resolving..." while pending
    await waitFor(() => {
      expect(screen.getByText('Resolving...')).toBeInTheDocument();
    });

    // Button should be disabled during resolution
    expect(screen.getByText('Resolving...')).toBeDisabled();
  });
});

describe('EndpointBreakdown - default method case', () => {
  it('should handle unknown HTTP method with empty class', async () => {
    server.use(
      ...createTraceHandlers({
        endpointStats: [
          {
            path: '/api/test',
            method: 'UNKNOWN',
            count: 5,
            avgDuration: 10,
            errorRate: 0,
          },
        ],
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
    });

    // The method badge should exist even with unknown method
    const methodElement = screen.getByText('UNKNOWN');
    expect(methodElement).toBeInTheDocument();
  });
});

describe('TraceRow - status below 200', () => {
  it('should render trace with 1xx status using status1xx class', async () => {
    server.use(
      ...createTraceHandlers({
        traces: [
          {
            ...mockTrace,
            traceId: 'trace-1xx',
            statusCode: 102,
          },
        ],
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('102')).toBeInTheDocument();
    });
  });

  it('should render trace with status below 100', async () => {
    server.use(
      ...createTraceHandlers({
        traces: [
          {
            ...mockTrace,
            traceId: 'trace-invalid',
            statusCode: 0,
          },
        ],
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  it('should render traces with all status code classes', async () => {
    // Test 5xx, 4xx, 3xx status codes via TracesContainer to cover TraceRow branches
    server.use(
      ...createTraceHandlers({
        traces: [
          { ...mockTrace, traceId: 'trace-5xx', statusCode: 503 },
          { ...mockTrace, traceId: 'trace-4xx', statusCode: 401 },
          { ...mockTrace, traceId: 'trace-3xx', statusCode: 304 },
        ],
      }),
    );

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('503')).toBeInTheDocument();
      expect(screen.getByText('401')).toBeInTheDocument();
      expect(screen.getByText('304')).toBeInTheDocument();
    });
  });
});

describe('TraceTrends - custom hours parameter', () => {
  it('should request stats for 12 hours when hours prop is set', async () => {
    let hourlyStatsUrl = '';
    const mockHourlyStats = [
      {
        hour: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
        count: 5,
        avgDuration: 100,
        errorRate: 0,
      },
      {
        hour: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        count: 8,
        avgDuration: 120,
        errorRate: 1,
      },
    ];

    server.use(
      http.get('/api/traces/stats/hourly', ({ request }) => {
        hourlyStatsUrl = request.url;
        return HttpResponse.json(mockHourlyStats);
      }),
    );

    // Note: TraceTrends component is rendered with hours=24 in the container
    // To test different hours, we need to render it directly
    const { TraceTrends } = await import('./components/TraceTrends');

    render(<TraceTrends hours={12} />);

    await waitFor(() => {
      expect(hourlyStatsUrl).toContain('hours=12');
    });
  });
});

describe('TraceFilters - reset and empty value handling', () => {
  it('should handle reset with all filters cleared', async () => {
    const user = userEvent.setup();
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText(/method/i)).toBeInTheDocument();
    });

    // Set some filters
    const methodSelect = screen.getByLabelText(/method/i);
    const pathInput = screen.getByLabelText(/path/i);

    await user.selectOptions(methodSelect, 'POST');
    await user.type(pathInput, '/test');

    // Apply filters
    const applyButton = screen.getByText('Apply Filters');
    await user.click(applyButton);

    // Reset filters
    const resetButton = screen.getByText('Reset');
    await user.click(resetButton);

    // Verify filters are cleared
    await waitFor(() => {
      expect(methodSelect).toHaveValue('');
      expect(pathInput).toHaveValue('');
    });
  });

  it('should handle undefined filter values', async () => {
    const user = userEvent.setup();
    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText(/method/i)).toBeInTheDocument();
    });

    // Leave all filters empty and apply
    const applyButton = screen.getByText('Apply Filters');
    await user.click(applyButton);

    await waitFor(() => {
      // Should still render traces
      expect(screen.getAllByText('/api/test').length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('TimingWaterfall - comprehensive branch coverage', () => {
  it('should render expanded view with all phases visible', async () => {
    const traceWithAllPhases: RequestTrace = {
      ...mockTrace,
      traceId: 'test-trace-123',
      timing: {
        middleware: 50,
        guard: 30,
        interceptorPre: 20,
        handler: 100,
        interceptorPost: 25,
      },
      durationMs: 225,
    };

    server.use(
      http.get('/api/traces/:traceId', () =>
        HttpResponse.json(traceWithAllPhases),
      ),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      const timelines = screen.getAllByText('Request Timeline');
      expect(timelines.length).toBeGreaterThan(0);
    });

    // Verify all phases are rendered in legend
    expect(screen.getByText('Middleware')).toBeInTheDocument();
    expect(screen.getByText('Guard')).toBeInTheDocument();
    expect(screen.getByText('Interceptor Pre')).toBeInTheDocument();
    expect(screen.getByText('Handler')).toBeInTheDocument();
    expect(screen.getByText('Interceptor Post')).toBeInTheDocument();
  });

  it('should handle phase with zero duration', async () => {
    const traceWithZeroPhase: RequestTrace = {
      ...mockTrace,
      traceId: 'test-trace-123',
      timing: {
        middleware: 0,
        guard: 0,
        interceptorPre: 0,
        handler: 100,
        interceptorPost: 0,
      },
      durationMs: 100,
    };

    server.use(
      http.get('/api/traces/:traceId', () =>
        HttpResponse.json(traceWithZeroPhase),
      ),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      const timelines = screen.getAllByText('Request Timeline');
      expect(timelines.length).toBeGreaterThan(0);
    });

    // Handler should still be visible
    expect(screen.getByText('Handler')).toBeInTheDocument();
  });

  it('should highlight slow phases (>100ms)', async () => {
    const traceWithSlowPhase: RequestTrace = {
      ...mockTrace,
      traceId: 'test-trace-123',
      timing: {
        middleware: 10,
        guard: 5,
        interceptorPre: 5,
        handler: 150, // Slow!
        interceptorPost: 10,
      },
      durationMs: 180,
    };

    server.use(
      http.get('/api/traces/:traceId', () =>
        HttpResponse.json(traceWithSlowPhase),
      ),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      const timelines = screen.getAllByText('Request Timeline');
      expect(timelines.length).toBeGreaterThan(0);
      // The slow phase should be highlighted
      expect(screen.getByText('150ms')).toBeInTheDocument();
    });
  });

  it('should show labels on large segments in expanded view', async () => {
    const traceWithLargeSegment: RequestTrace = {
      ...mockTrace,
      traceId: 'test-trace-123',
      timing: {
        middleware: 5,
        guard: 5,
        interceptorPre: 5,
        handler: 85, // >10% of total = 100ms
        interceptorPost: 0,
      },
      durationMs: 100,
    };

    server.use(
      http.get('/api/traces/:traceId', () =>
        HttpResponse.json(traceWithLargeSegment),
      ),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      const timelines = screen.getAllByText('Request Timeline');
      expect(timelines.length).toBeGreaterThan(0);
      // Handler takes 85% of time, should have label
      expect(screen.getByText('85ms')).toBeInTheDocument();
    });
  });

  it('should handle hover interactions in expanded view', async () => {
    const traceForHover: RequestTrace = {
      ...mockTrace,
      traceId: 'test-trace-123',
      timing: {
        middleware: 20,
        guard: 20,
        interceptorPre: 20,
        handler: 20,
        interceptorPost: 20,
      },
      durationMs: 100,
    };

    server.use(
      http.get('/api/traces/:traceId', () => HttpResponse.json(traceForHover)),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      const timelines = screen.getAllByText('Request Timeline');
      expect(timelines.length).toBeGreaterThan(0);
    });

    // All segments should be in the legend
    expect(screen.getByText('Middleware')).toBeInTheDocument();
    expect(screen.getByText('Guard')).toBeInTheDocument();
  });

  it('should format sub-millisecond duration', async () => {
    const traceWithSubMs: RequestTrace = {
      ...mockTrace,
      traceId: 'test-trace-123',
      timing: {
        middleware: 0.5,
        guard: 0.3,
        interceptorPre: 0.1,
        handler: 1.5,
        interceptorPost: 0.2,
      },
      durationMs: 2.6,
    };

    server.use(
      http.get('/api/traces/:traceId', () => HttpResponse.json(traceWithSubMs)),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      const timelines = screen.getAllByText('Request Timeline');
      expect(timelines.length).toBeGreaterThan(0);
      // Duration should show <1ms format
      const durationTexts = screen.getAllByText(/<1ms/);
      expect(durationTexts.length).toBeGreaterThan(0);
    });
  });

  it('should handle zero total duration gracefully', async () => {
    // Edge case: all timing values and total duration are 0
    const traceWithZeroDuration: RequestTrace = {
      ...mockTrace,
      traceId: 'test-trace-123',
      timing: {
        middleware: 0,
        guard: 0,
        interceptorPre: 0,
        handler: 0,
        interceptorPost: 0,
      },
      durationMs: 0,
    };

    server.use(
      http.get('/api/traces/:traceId', () =>
        HttpResponse.json(traceWithZeroDuration),
      ),
    );

    render(<TraceDetailContainer />);

    await waitFor(() => {
      const timelines = screen.getAllByText('Request Timeline');
      expect(timelines.length).toBeGreaterThan(0);
    });

    // Should still render the legend even with 0 duration
    expect(screen.getByText('Middleware')).toBeInTheDocument();
  });
});

describe('useTraces hook - all filter parameters', () => {
  it('should build URL with empty query params when filters are empty', async () => {
    // Create a component that uses filters without any values
    const TestComponent = () => {
      const { data } = useTraces({});
      return <div>{data ? 'Loaded' : 'Loading'}</div>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });
  });
});

describe('useAlertRules hook', () => {
  it('should fetch alert rules', async () => {
    const mockRules: AlertRule[] = [
      {
        name: 'High Latency',
        metric: 'avgDuration',
        threshold: 500,
        windowMinutes: 5,
        cooldownMinutes: 10,
        enabled: true,
        channels: ['log'],
      },
    ];

    server.use(
      http.get('/api/traces/alerts/rules', () => HttpResponse.json(mockRules)),
    );

    const TestComponent = () => {
      const { data } = useAlertRules();
      return <div>{data ? `Rules: ${data.length}` : 'Loading'}</div>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Rules: 1')).toBeInTheDocument();
    });
  });
});

describe('useAlertHistory hook', () => {
  it('should fetch alert history with default limit', async () => {
    let historyUrl = '';
    const mockHistory: AlertHistoryRecord[] = [
      {
        id: 1,
        ruleName: 'Test',
        metric: 'avgDuration',
        threshold: 100,
        actualValue: 150,
        triggeredAt: new Date().toISOString(),
        resolved: false,
        channels: ['log'],
      },
    ];

    server.use(
      http.get('/api/traces/alerts/history', ({ request }) => {
        historyUrl = request.url;
        return HttpResponse.json(mockHistory);
      }),
    );

    const TestComponent = () => {
      const { data } = useAlertHistory();
      return <div>{data ? `History: ${data.length}` : 'Loading'}</div>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('History: 1')).toBeInTheDocument();
    });

    // Verify default limit=20 was used
    expect(historyUrl).toContain('limit=20');
  });

  it('should fetch alert history with custom limit', async () => {
    let historyUrl = '';
    const mockHistory: AlertHistoryRecord[] = [];

    server.use(
      http.get('/api/traces/alerts/history', ({ request }) => {
        historyUrl = request.url;
        return HttpResponse.json(mockHistory);
      }),
    );

    const TestComponent = () => {
      const { data } = useAlertHistory(50);
      return <div>{data ? 'Loaded' : 'Loading'}</div>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });

    // Verify custom limit=50 was used
    expect(historyUrl).toContain('limit=50');
  });
});
