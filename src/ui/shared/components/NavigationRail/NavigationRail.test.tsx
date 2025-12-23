// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen, fireEvent, act } from 'ui/test-utils';
import { NavigationRail } from './NavigationRail';
import { useNavStore } from 'ui/shared/stores/navStore';

// Mock dependencies
jest.mock('ui/shared/stores/navStore', () => ({
  useNavStore: jest.fn(),
}));

jest.mock('@tanstack/react-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    Link: ({ children, to, className }: any) => (
      <a href={to} className={className} data-testid={`nav-link-${to}`}>
        {children}
      </a>
    ),
  };
});

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
  const mockToggleExpand = jest.fn();
  const mockSetExpanded = jest.fn();
  const mockToggleTheme = jest.fn();

  const defaultStoreState = {
    isExpanded: true,
    activeSection: 'about',
    theme: 'light',
    toggleExpand: mockToggleExpand,
    setExpanded: mockSetExpanded,
    toggleTheme: mockToggleTheme,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector(defaultStoreState),
    );
    global.innerWidth = 1024; // Reset window width
    global.dispatchEvent(new Event('resize'));
  });

  it('renders all navigation items', () => {
    render(<NavigationRail />);

    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('renders in expanded state correctly', () => {
    render(<NavigationRail />);

    const toggleButton = screen.getByLabelText('Collapse navigation');
    expect(toggleButton).toBeInTheDocument();
    expect(screen.getByText('About')).toBeVisible();
  });

  it('renders in collapsed state correctly', () => {
    (useNavStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ ...defaultStoreState, isExpanded: false }),
    );

    render(<NavigationRail />);

    const toggleButton = screen.getByLabelText('Expand navigation');
    expect(toggleButton).toBeInTheDocument();
    // Labels should not be rendered when collapsed
    expect(screen.queryByText('About')).not.toBeInTheDocument();
  });

  it('calls toggleExpand when toggle button is clicked', () => {
    render(<NavigationRail />);

    const toggleButton = screen.getByLabelText('Collapse navigation');
    fireEvent.click(toggleButton);

    expect(mockToggleExpand).toHaveBeenCalledTimes(1);
  });

  it('calls toggleTheme when theme button is clicked', () => {
    render(<NavigationRail />);

    const themeButton = screen.getByLabelText('Toggle theme');
    fireEvent.click(themeButton);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('highlights the active section', () => {
    (useNavStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ ...defaultStoreState, activeSection: 'experience' }),
    );

    render(<NavigationRail />);

    const experienceLink = screen.getByTestId('nav-link-/experience');
    expect(experienceLink.className).toContain('activeLink');

    const aboutLink = screen.getByTestId('nav-link-/');
    expect(aboutLink.className).not.toContain('activeLink');
  });

  it('collapses on window resize if width < 768px', () => {
    render(<NavigationRail />);

    // Simulate resize
    act(() => {
      global.innerWidth = 500;
      global.dispatchEvent(new Event('resize'));
    });

    expect(mockSetExpanded).toHaveBeenCalledWith(false);
  });

  it('does not collapse on window resize if width >= 768px', () => {
    render(<NavigationRail />);

    // Simulate resize
    act(() => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));
    });

    expect(mockSetExpanded).not.toHaveBeenCalledWith(false);
  });
});
