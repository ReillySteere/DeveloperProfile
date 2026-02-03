// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen, fireEvent, waitFor } from 'ui/test-utils';
import ProjectsContainer from './projects.container';
import axios from 'axios';
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

    AlertCircle: () =>
      React.createElement('span', { 'data-testid': 'alert-icon' }),

    RefreshCw: () =>
      React.createElement('span', { 'data-testid': 'refresh-icon' }),

    FileText: () =>
      React.createElement('span', { 'data-testid': 'file-text-icon' }),
  };
});

// Mock TanStack Router
jest.mock('@tanstack/react-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const actual = jest.requireActual('@tanstack/react-router');
  return {
    ...actual,
    Link: (props: any) =>
      React.createElement('a', { ...props, href: props.to }, props.children),
  };
});

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

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

    mockedAxios.get.mockReset();
  });

  it('renders loading state', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    render(<ProjectsContainer />);

    // QueryState renders skeletons when loading

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('renders error state and handles retry', async () => {
    // First call (projects) fails, second call (case studies) succeeds
    mockedAxios.get
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce({ data: [] }); // case studies

    render(<ProjectsContainer />);

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    // After retry: projects succeed, case studies already loaded
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockProjects })
      .mockResolvedValueOnce({ data: [] });

    const retryButton = screen.getByRole('button', { name: /Try Again/i });

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument();
    });
  });

  it('renders projects list successfully and covers hook internals', async () => {
    // Mock both projects and case studies API calls
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockProjects })
      .mockResolvedValueOnce({ data: [] }); // case studies

    render(<ProjectsContainer />);

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument();
    });

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
    expect(screen.getByText('Project Two')).toBeInTheDocument();
    expect(screen.getByText(/Jan 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Present/)).toBeInTheDocument();
    expect(screen.getByText('Result 2')).toBeInTheDocument();
  });

  it('shows case study link when case study exists for project', async () => {
    const mockCaseStudies = [
      {
        id: 'cs-1',
        slug: 'project-one-case-study',
        projectId: '1',
        published: true,
      },
    ];

    mockedAxios.get
      .mockResolvedValueOnce({ data: mockProjects })
      .mockResolvedValueOnce({ data: mockCaseStudies });

    render(<ProjectsContainer />);

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument();
    });

    // Should show case study link for Project One
    expect(screen.getByText('View Case Study')).toBeInTheDocument();
  });

  it('does not show case study link when no case study exists', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockProjects })
      .mockResolvedValueOnce({ data: [] }); // no case studies

    render(<ProjectsContainer />);

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument();
    });

    // Should not show case study link
    expect(screen.queryByText('View Case Study')).not.toBeInTheDocument();
  });
});
