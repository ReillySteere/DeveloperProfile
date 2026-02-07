// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen, fireEvent, act } from 'ui/test-utils';
import { NavigationRail } from './NavigationRail';
import { useNavStore } from 'ui/shared/hooks/useNavStore';

jest.mock('@tanstack/react-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    Link: ({ children, to, className }: any) => (
      <a href={to} className={className} data-testid={`nav-link-${to}`}>
        {children}
      </a>
    ),
    useLocation: jest.fn(() => ({ pathname: '/about' })),
  };
});

const { useLocation } = jest.requireMock('@tanstack/react-router');

// Mock framer-motion to avoid animation issues
jest.mock('framer-motion', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars
  const React = require('react');
  return {
    motion: {
      div: ({ children, className, ...props }: any) => (
        <div className={className} {...props}>
          {children}
        </div>
      ),
    },
  };
});

describe('NavigationRail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNavStore.setState({
      isExpanded: true,
      activeSection: 'about',
      theme: 'light',
    });
    global.innerWidth = 1024; // Reset window width
    global.dispatchEvent(new Event('resize'));
  });

  it('renders all navigation items', () => {
    render(<NavigationRail />);

    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('renders in expanded state correctly', () => {
    render(<NavigationRail />);

    const toggleButton = screen.getByLabelText('Collapse navigation');
    expect(toggleButton).toBeInTheDocument();
    expect(screen.getByText('About')).toBeVisible();
  });

  it('renders in collapsed state correctly', () => {
    act(() => {
      useNavStore.setState({ isExpanded: false });
    });

    render(<NavigationRail />);

    const toggleButton = screen.getByLabelText('Expand navigation');
    expect(toggleButton).toBeInTheDocument();
    // Labels should not be rendered when collapsed
    expect(screen.queryByText('About')).not.toBeInTheDocument();
  });

  it('toggles expansion when toggle button is clicked', () => {
    render(<NavigationRail />);

    const toggleButton = screen.getByLabelText('Collapse navigation');
    fireEvent.click(toggleButton);

    expect(useNavStore.getState().isExpanded).toBe(false);
    expect(screen.getByLabelText('Expand navigation')).toBeInTheDocument();
  });

  it('toggles theme when theme button is clicked', () => {
    render(<NavigationRail />);

    const themeButton = screen.getByLabelText('Toggle theme');

    // Light -> Dark
    fireEvent.click(themeButton);
    expect(useNavStore.getState().theme).toBe('dark');

    // Dark -> Light
    fireEvent.click(themeButton);
    expect(useNavStore.getState().theme).toBe('light');
  });

  it('highlights the active section', () => {
    act(() => {
      useNavStore.setState({ activeSection: 'experience' });
    });

    render(<NavigationRail />);

    const experienceLink = screen.getByTestId('nav-link-/experience');
    expect(experienceLink.className).toContain('activeLink');

    const aboutLink = screen.getByTestId('nav-link-/about');
    expect(aboutLink.className).not.toContain('activeLink');
  });

  it('collapses on window resize if width < 768px', () => {
    render(<NavigationRail />);

    // Simulate resize
    act(() => {
      global.innerWidth = 500;
      global.dispatchEvent(new Event('resize'));
    });

    expect(useNavStore.getState().isExpanded).toBe(false);
  });

  it('does not collapse on window resize if width >= 768px', () => {
    render(<NavigationRail />);

    // Simulate resize
    act(() => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));
    });

    expect(useNavStore.getState().isExpanded).toBe(true);
  });

  it('shows PerformanceBadge wrapper when not on performance page', () => {
    useLocation.mockReturnValue({ pathname: '/about' });
    const { container } = render(<NavigationRail />);

    // The wrapper should be present (badge content depends on web vitals data)
    expect(
      container.querySelector('.performanceBadgeWrapper'),
    ).toBeInTheDocument();
  });

  it('hides PerformanceBadge wrapper when on performance page', () => {
    useLocation.mockReturnValue({ pathname: '/performance' });
    const { container } = render(<NavigationRail />);

    expect(
      container.querySelector('.performanceBadgeWrapper'),
    ).not.toBeInTheDocument();
  });
});
