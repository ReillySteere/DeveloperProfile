import React from 'react';
import { render, screen } from 'ui/test-utils';
import Experience from './experience.container';
import { useExperiences } from './hooks/useExperience';
import { ExperienceEntry } from 'shared/types';

// Mock the hook
jest.mock('./hooks/useExperience', () => ({
  useExperiences: jest.fn(),
}));

// Mock IntersectionObserver
beforeAll(() => {
  // @ts-expect-error - Mocking global IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {
      return null;
    }
    disconnect() {
      return null;
    }
    unobserve() {
      return null;
    }
  };
});

const mockExperiences: ExperienceEntry[] = [
  {
    id: '1',
    company: 'Test Company',
    role: 'Software Engineer',
    description: 'Worked on stuff',
    startDate: '2023-01-01',
    endDate: null,
    bulletPoints: ['Point 1', 'Point 2'],
    tags: ['React', 'TypeScript'],
  },
  {
    id: '2',
    company: 'Another Company',
    role: 'Junior Developer',
    description: 'Learning stuff',
    startDate: '2022-01-01',
    endDate: '2022-12-31',
    bulletPoints: ['Learned A', 'Learned B'],
    tags: ['JavaScript', 'HTML'],
  },
];

describe('Experience Container', () => {
  const mockUseExperiences = useExperiences as jest.Mock;

  beforeEach(() => {
    mockUseExperiences.mockClear();
  });

  it('renders loading state', () => {
    mockUseExperiences.mockReturnValue({
      experiences: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<Experience />);

    // Frame should be present
    const frame = document.getElementById('experience');
    expect(frame).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseExperiences.mockReturnValue({
      experiences: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch'),
      refetch: jest.fn(),
    });

    render(<Experience />);

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
  });

  it('renders experience list successfully', () => {
    mockUseExperiences.mockReturnValue({
      experiences: mockExperiences,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<Experience />);

    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Another Company')).toBeInTheDocument();
    expect(screen.getByText('Junior Developer')).toBeInTheDocument();
  });
});
