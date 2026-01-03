// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen, fireEvent } from 'ui/test-utils';
import ProjectsContainer from './projects.container';
import { useQuery } from '@tanstack/react-query';
import { Project } from 'shared/types';

// Mock framer-motion
jest.mock('framer-motion', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(
        /* eslint-disable @typescript-eslint/no-unused-vars */
        (
          {
            children,
            initial,
            animate,
            exit,
            variants,
            transition,
            whileInView,
            viewport,
            ...props
          }: any,
          ref: any,
        ) => {
          /* eslint-enable @typescript-eslint/no-unused-vars */
          return (
            <div ref={ref} {...props}>
              {children}
            </div>
          );
        },
      ),
    },
  };
});

// Mock lucide-react
jest.mock('lucide-react', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    Calendar: () =>
      React.createElement('span', { 'data-testid': 'calendar-icon' }),
    Link: () => React.createElement('span', { 'data-testid': 'link-icon' }),
    AlertCircle: () =>
      React.createElement('span', { 'data-testid': 'alert-icon' }),
    RefreshCw: () =>
      React.createElement('span', { 'data-testid': 'refresh-icon' }),
  };
});

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

const mockUseQuery = useQuery as jest.Mock;

const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Project One',
    shortDescription: 'Desc One',
    role: 'Role One',
    requirements: ['Req 1'],
    execution: ['Exec 1a', 'Exec 1b'],
    results: ['Result 1a', 'Result 1b'],
    technologies: ['Tech A'],
    startDate: '2023-01-15',
    endDate: '2023-12-15',
    link: 'http://example.com',
  },
  {
    id: '2',
    title: 'Project Two',
    shortDescription: 'Desc Two',
    role: 'Role Two',
    requirements: ['Req 2'],
    execution: ['Exec 2'],
    results: ['Result 2'],
    technologies: ['Tech B'],
    startDate: '2024-01-15',
  },
];

describe('Projects Container', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ProjectsContainer />);
    // QueryState renders skeletons when loading
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('renders error state and handles retry', () => {
    const refetch = jest.fn();
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed'),
      refetch,
    });

    render(<ProjectsContainer />);
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(retryButton);
    expect(refetch).toHaveBeenCalled();
  });

  it('renders projects list successfully and covers hook internals', () => {
    // We want to cover fetchProjects inside useProjects too
    mockUseQuery.mockImplementation(({ queryFn }) => {
      if (queryFn) {
        queryFn();
        jest.runAllTimers();
      }
      return {
        data: mockProjects,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    render(<ProjectsContainer />);

    expect(screen.getByText('Project One')).toBeInTheDocument();
    expect(screen.getByText('Role One')).toBeInTheDocument();
    expect(screen.getByText('Desc One')).toBeInTheDocument();
    expect(screen.getByText('Req 1')).toBeInTheDocument();
    expect(screen.getByText('Exec 1a')).toBeInTheDocument();
    expect(screen.getByText('Exec 1b')).toBeInTheDocument();
    expect(screen.getByText('Result 1a')).toBeInTheDocument();
    expect(screen.getByText('Result 1b')).toBeInTheDocument();
    expect(screen.getByText('Tech A')).toBeInTheDocument();

    expect(screen.getByText(/Jan 2023/)).toBeInTheDocument();
    expect(screen.getByText(/Dec 2023/)).toBeInTheDocument();

    const linkButton = screen.getByText('View Project');
    expect(linkButton).toBeInTheDocument();
    const link = linkButton.closest('a');
    expect(link).toHaveAttribute('href', 'http://example.com');
    expect(link).toHaveAttribute('target', '_blank');

    expect(screen.getByText('Project Two')).toBeInTheDocument();
    expect(screen.getByText(/Jan 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Present/)).toBeInTheDocument();
    expect(screen.getByText('Result 2')).toBeInTheDocument();

    expect(screen.getAllByText('View Project')).toHaveLength(1);
  });
});
