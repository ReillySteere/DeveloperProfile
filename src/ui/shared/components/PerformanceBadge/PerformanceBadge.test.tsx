import React from 'react';
import { render, screen } from 'ui/test-utils';

// Mock TanStack Router Link
jest.mock('@tanstack/react-router', () => ({
  ...jest.requireActual('@tanstack/react-router'),
  Link: ({
    children,
    to,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => {
    return React.createElement('a', { href: to, ...props }, children);
  },
}));

jest.mock('web-vitals', () => ({
  onLCP: jest.fn(),
  onINP: jest.fn(),
  onCLS: jest.fn(),
  onFCP: jest.fn(),
  onTTFB: jest.fn(),
}));

jest.mock('ui/shared/services/performanceObserver', () => ({
  performanceObserver: {
    getCurrentMetrics: jest.fn().mockReturnValue({}),
    subscribe: jest.fn().mockReturnValue(jest.fn()),
    reportToServer: jest.fn(),
    getSessionId: jest.fn().mockReturnValue('test-session'),
  },
}));

import { PerformanceBadge } from './PerformanceBadge';
import { performanceObserver } from 'ui/shared/services/performanceObserver';

const mockGetCurrentMetrics =
  performanceObserver.getCurrentMetrics as jest.Mock;

describe('PerformanceBadge', () => {
  beforeEach(() => {
    mockGetCurrentMetrics.mockReturnValue({});
  });

  it('returns null when no vitals are available', () => {
    const { container } = render(<PerformanceBadge />);
    expect(container.innerHTML).toBe('');
  });

  it('renders badge with score when vitals are present', () => {
    mockGetCurrentMetrics.mockReturnValue({
      lcp: {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 2000,
        id: 'v1',
        navigationType: 'navigate',
        timestamp: Date.now(),
      },
      cls: {
        name: 'CLS',
        value: 0.05,
        rating: 'good',
        delta: 0.05,
        id: 'v2',
        navigationType: 'navigate',
        timestamp: Date.now(),
      },
      fcp: {
        name: 'FCP',
        value: 1200,
        rating: 'good',
        delta: 1200,
        id: 'v3',
        navigationType: 'navigate',
        timestamp: Date.now(),
      },
    });

    render(<PerformanceBadge />);

    expect(screen.getByTestId('performance-badge')).toBeInTheDocument();
    expect(screen.getByText('Perf')).toBeInTheDocument();
  });

  it('renders with partial vitals (only LCP)', () => {
    mockGetCurrentMetrics.mockReturnValue({
      lcp: {
        name: 'LCP',
        value: 2500,
        rating: 'good',
        delta: 2500,
        id: 'v1',
        navigationType: 'navigate',
        timestamp: Date.now(),
      },
    });

    render(<PerformanceBadge />);

    expect(screen.getByTestId('performance-badge')).toBeInTheDocument();
  });
});
