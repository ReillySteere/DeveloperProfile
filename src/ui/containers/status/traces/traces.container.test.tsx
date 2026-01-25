import React from 'react';
import { render, screen, fireEvent, waitFor, act } from 'ui/test-utils';
import TracesContainer from './traces.container';
import TraceDetailContainer from './trace-detail.container';
import type { RequestTrace, TraceStats } from 'shared/types';
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

describe('TracesContainer', () => {
  beforeEach(() => {
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/traces/stats')) {
        return Promise.resolve({ data: mockStats });
      }
      if (url.includes('/api/traces')) {
        return Promise.resolve({ data: [mockTrace] });
      }
      return Promise.reject(new Error('Not found'));
    });
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
      expect(screen.getByText('/api/test')).toBeInTheDocument();
    });

    // There may be multiple GET elements (in filter dropdown and trace row)
    const traceRow = screen.getByText('/api/test').closest('div');
    expect(traceRow).toBeInTheDocument();
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
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/traces/stats')) {
        return Promise.resolve({ data: mockStats });
      }
      if (url.includes('/api/traces')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });

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
      expect(screen.getByText('/api/test')).toBeInTheDocument();
    });

    const traceRow = screen.getByText('/api/test').closest('div');
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
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/traces/stats')) {
        return Promise.resolve({ data: { ...mockStats, errorRate: 10 } });
      }
      if (url.includes('/api/traces')) {
        return Promise.resolve({ data: [mockTrace] });
      }
      return Promise.reject(new Error('Not found'));
    });

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
      expect(screen.getByText('/api/test')).toBeInTheDocument();
    });

    const traceRow = screen.getByText('/api/test').closest('[role="button"]');
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
      expect(screen.getByText('/api/test')).toBeInTheDocument();
    });

    const traceRow = screen.getByText('/api/test').closest('[role="button"]');
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
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/traces/stats')) {
        return Promise.resolve({ data: mockStats });
      }
      if (url.includes('/api/traces')) {
        return Promise.resolve({
          data: [{ ...mockTrace, durationMs: 0.5 }],
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('<1ms')).toBeInTheDocument();
    });
  });

  it('should display trace with seconds duration', async () => {
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/traces/stats')) {
        return Promise.resolve({ data: mockStats });
      }
      if (url.includes('/api/traces')) {
        return Promise.resolve({
          data: [{ ...mockTrace, durationMs: 2500 }],
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('2.50s')).toBeInTheDocument();
    });
  });

  it('should display trace with 1xx status code', async () => {
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/traces/stats')) {
        return Promise.resolve({ data: { ...mockStats, totalCount: 50 } });
      }
      if (url.includes('/api/traces')) {
        return Promise.resolve({
          data: [{ ...mockTrace, statusCode: 101 }],
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<TracesContainer />);

    await waitFor(() => {
      expect(screen.getByText('101')).toBeInTheDocument();
    });
  });

  it('should display trace with 3xx status code', async () => {
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/traces/stats')) {
        return Promise.resolve({ data: mockStats });
      }
      if (url.includes('/api/traces')) {
        return Promise.resolve({
          data: [{ ...mockTrace, statusCode: 301 }],
        });
      }
      return Promise.reject(new Error('Not found'));
    });

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
});
