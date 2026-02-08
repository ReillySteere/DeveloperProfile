// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen, fireEvent, act, within } from 'ui/test-utils';
import { NavigationRail } from './NavigationRail';
import { useNavStore } from 'ui/shared/hooks/useNavStore';

jest.mock('@tanstack/react-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    Link: ({ children, to, className, onClick }: any) => (
      <a
        href={to}
        className={className}
        data-testid={`nav-link-${to}`}
        onClick={onClick}
      >
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
    AnimatePresence: ({ children }: any) => <>{children}</>,
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

  // Helper to get the desktop nav container
  const getDesktopNav = () =>
    screen.getByLabelText('Main navigation') as HTMLElement;

  // Helper to get the mobile nav container
  const getMobileNav = () =>
    screen.getByLabelText('Mobile navigation') as HTMLElement;

  it('renders all navigation items in desktop nav', () => {
    render(<NavigationRail />);

    const desktopNav = getDesktopNav();
    expect(within(desktopNav).getByText('About')).toBeInTheDocument();
    expect(within(desktopNav).getByText('Blog')).toBeInTheDocument();
    expect(within(desktopNav).getByText('Experience')).toBeInTheDocument();
    expect(within(desktopNav).getByText('Projects')).toBeInTheDocument();
    expect(within(desktopNav).getByText('Accessibility')).toBeInTheDocument();
  });

  it('renders primary items in mobile bottom nav', () => {
    render(<NavigationRail />);

    const mobileNav = getMobileNav();
    // Primary items (first 4)
    expect(within(mobileNav).getByText('About')).toBeInTheDocument();
    expect(within(mobileNav).getByText('Blog')).toBeInTheDocument();
    expect(within(mobileNav).getByText('Experience')).toBeInTheDocument();
    expect(within(mobileNav).getByText('Projects')).toBeInTheDocument();
    // More button for secondary items
    expect(within(mobileNav).getByText('More')).toBeInTheDocument();
  });

  it('renders in expanded state correctly', () => {
    render(<NavigationRail />);

    const toggleButton = screen.getByLabelText('Collapse navigation');
    expect(toggleButton).toBeInTheDocument();
    const desktopNav = getDesktopNav();
    expect(within(desktopNav).getByText('About')).toBeVisible();
  });

  it('renders in collapsed state correctly', () => {
    act(() => {
      useNavStore.setState({ isExpanded: false });
    });

    render(<NavigationRail />);

    const toggleButton = screen.getByLabelText('Expand navigation');
    expect(toggleButton).toBeInTheDocument();
    // Labels should not be rendered in desktop nav when collapsed
    const desktopNav = getDesktopNav();
    expect(within(desktopNav).queryByText('About')).not.toBeInTheDocument();
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

  it('highlights the active section in desktop nav', () => {
    act(() => {
      useNavStore.setState({ activeSection: 'experience' });
    });

    render(<NavigationRail />);

    const desktopNav = getDesktopNav();
    const experienceLink = within(desktopNav).getByTestId(
      'nav-link-/experience',
    );
    expect(experienceLink.className).toContain('activeLink');

    const aboutLink = within(desktopNav).getByTestId('nav-link-/about');
    expect(aboutLink.className).not.toContain('activeLink');
  });

  it('highlights the active section in mobile nav', () => {
    act(() => {
      useNavStore.setState({ activeSection: 'experience' });
    });

    render(<NavigationRail />);

    const mobileNav = getMobileNav();
    const experienceLink = within(mobileNav).getByTestId(
      'nav-link-/experience',
    );
    expect(experienceLink.className).toContain('bottomNavActive');

    const aboutLink = within(mobileNav).getByTestId('nav-link-/about');
    expect(aboutLink.className).not.toContain('bottomNavActive');
  });

  it('opens more menu when More button is clicked', () => {
    render(<NavigationRail />);

    const mobileNav = getMobileNav();
    const moreButton = within(mobileNav).getByLabelText(
      'More navigation options',
    );

    fireEvent.click(moreButton);

    // Get the more menu - it's rendered outside the mobile nav
    const moreMenu = document.querySelector('.moreMenu') as HTMLElement;
    expect(moreMenu).toBeInTheDocument();

    // Secondary items should be visible in more menu
    expect(within(moreMenu).getByText('Case Studies')).toBeInTheDocument();
    expect(within(moreMenu).getByText('Status')).toBeInTheDocument();
    expect(within(moreMenu).getByText('Performance')).toBeInTheDocument();
    expect(within(moreMenu).getByText('Architecture')).toBeInTheDocument();
    // Theme toggle in more menu
    expect(within(moreMenu).getByText('Dark Mode')).toBeInTheDocument();
  });

  it('closes more menu when clicking outside', () => {
    render(<NavigationRail />);

    const mobileNav = getMobileNav();
    const moreButton = within(mobileNav).getByLabelText(
      'More navigation options',
    );

    fireEvent.click(moreButton);
    const moreMenu = document.querySelector('.moreMenu') as HTMLElement;
    expect(within(moreMenu).getByText('Case Studies')).toBeInTheDocument();

    // Click overlay to close
    const overlay = document.querySelector('.moreOverlay');
    fireEvent.click(overlay!);

    expect(document.querySelector('.moreMenu')).not.toBeInTheDocument();
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

  it('toggles theme via more menu', () => {
    render(<NavigationRail />);

    const mobileNav = getMobileNav();
    const moreButton = within(mobileNav).getByLabelText(
      'More navigation options',
    );

    fireEvent.click(moreButton);

    const themeMenuItem = screen.getByText('Dark Mode');
    fireEvent.click(themeMenuItem);

    expect(useNavStore.getState().theme).toBe('dark');
    // More menu should close after clicking
    expect(screen.queryByText('Dark Mode')).not.toBeInTheDocument();
  });

  it('highlights More button when secondary item is active', () => {
    act(() => {
      useNavStore.setState({ activeSection: 'status' }); // Status is a secondary item
    });

    render(<NavigationRail />);

    const mobileNav = getMobileNav();
    const moreButton = within(mobileNav).getByLabelText(
      'More navigation options',
    );
    expect(moreButton.className).toContain('bottomNavActive');
  });

  it('closes more menu when clicking a secondary nav item', () => {
    render(<NavigationRail />);

    const mobileNav = getMobileNav();
    const moreButton = within(mobileNav).getByLabelText(
      'More navigation options',
    );

    fireEvent.click(moreButton);

    const moreMenu = document.querySelector('.moreMenu') as HTMLElement;
    const caseStudiesLink = within(moreMenu).getByText('Case Studies');
    fireEvent.click(caseStudiesLink);

    // More menu should close after clicking a link
    expect(document.querySelector('.moreMenu')).not.toBeInTheDocument();
  });

  it('highlights active secondary item in more menu', () => {
    act(() => {
      useNavStore.setState({ activeSection: 'status' });
    });

    render(<NavigationRail />);

    const mobileNav = getMobileNav();
    const moreButton = within(mobileNav).getByLabelText(
      'More navigation options',
    );

    fireEvent.click(moreButton);

    const moreMenu = document.querySelector('.moreMenu') as HTMLElement;
    const statusLink = within(moreMenu).getByTestId('nav-link-/status');
    expect(statusLink.className).toContain('moreMenuActive');
  });

  it('shows Light Mode text in more menu when theme is dark', () => {
    act(() => {
      useNavStore.setState({ theme: 'dark' });
    });

    render(<NavigationRail />);

    const mobileNav = getMobileNav();
    const moreButton = within(mobileNav).getByLabelText(
      'More navigation options',
    );

    fireEvent.click(moreButton);

    const moreMenu = document.querySelector('.moreMenu') as HTMLElement;
    expect(within(moreMenu).getByText('Light Mode')).toBeInTheDocument();
  });
});
