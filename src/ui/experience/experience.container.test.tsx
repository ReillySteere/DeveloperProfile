import React from 'react';
import { render, screen, fireEvent, waitFor, act } from 'ui/test-utils';
import Experience from './experience.container';
import ExperienceSection from './components/ExperienceSection';
import axios from 'axios';
import { ExperienceEntry } from 'shared/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock framer-motion to avoid animation issues
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      section: React.forwardRef(({ children, ...props }: any, ref: any) => (
        <section ref={ref} {...props}>
          {children}
        </section>
      )),
    },
    useAnimation: () => ({
      start: jest.fn(),
    }),
  };
});

// Mock react-intersection-observer for ExperienceSection
jest.mock('react-intersection-observer', () => ({
  useInView: () => [jest.fn(), true], // Always in view
}));

// Mock global IntersectionObserver for ExperiencePage
const mockIntersectionObserver = jest.fn();
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

beforeAll(() => {
  window.IntersectionObserver = mockIntersectionObserver;
  mockIntersectionObserver.mockImplementation((callback) => {
    return {
      observe: mockObserve.mockImplementation((element) => {
        // Store callback to trigger it manually in tests
        (window as any).__intersectionCallback = callback;
      }),
      disconnect: mockDisconnect,
      unobserve: jest.fn(),
    };
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  // Reset scrollIntoView mock
  Element.prototype.scrollIntoView = jest.fn();
});

const mockExperiences: ExperienceEntry[] = [
  {
    id: '1',
    company: 'Test Company',
    role: 'Software Engineer',
    description: 'Worked on stuff',
    startDate: '2023-01-15', // Mid-month to avoid timezone issues
    endDate: null, // Present
    bulletPoints: ['Point 1', 'Point 2'],
    tags: ['React', 'TypeScript'],
  },
  {
    id: '2',
    company: 'Another Company',
    role: 'Junior Developer',
    description: 'Learning stuff',
    startDate: '2022-01-15',
    endDate: '2022-12-15',
    bulletPoints: ['Learned A', 'Learned B'],
    tags: ['JavaScript', 'HTML'],
  },
];

describe('Experience Container', () => {
  it('renders loading state initially', () => {
    // Return a promise that never resolves immediately to show loading
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    render(<Experience />);
    expect(screen.getByText(/Loading experiences.../i)).toBeInTheDocument();
  });

  it('renders error state', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Failed to fetch'));

    render(<Experience />);

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });

  it('renders experience list successfully', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockExperiences });

    render(<Experience />);

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Another Company')).toBeInTheDocument();
    expect(screen.getByText('Junior Developer')).toBeInTheDocument();

    // Check date formatting
    expect(screen.getByText(/Jan 2023 – Present/i)).toBeInTheDocument();
    expect(screen.getByText(/Jan 2022 – Dec 2022/i)).toBeInTheDocument();

    // Check tags
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('handles navigation dots interaction', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockExperiences });
    render(<Experience />);

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    const dots = screen.getAllByRole('button', { name: /Go to section/i });
    expect(dots).toHaveLength(2);

    // Click second dot
    fireEvent.click(dots[1]);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

    // Key press on dot (Enter)
    fireEvent.keyDown(dots[0], { key: 'Enter' });
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(2);

    // Key press on dot (Space)
    fireEvent.keyDown(dots[0], { key: ' ' });
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(3);
  });

  it('ExperienceSection handles object refs', () => {
    const ref = React.createRef<HTMLElement>();
    const entry = mockExperiences[0];

    render(<ExperienceSection entry={entry} index={0} ref={ref} />);

    // The ref should be assigned the section element
    expect(ref.current).toBeInTheDocument();
    expect(ref.current?.tagName).toBe('SECTION');
  });

  it('updates active dot on scroll (IntersectionObserver)', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockExperiences });
    render(<Experience />);

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    // Trigger IntersectionObserver callback
    const callback = (window as any).__intersectionCallback;
    if (callback) {
      act(() => {
        callback([
          { isIntersecting: true, target: { getAttribute: () => '1' } },
        ]);
      });
    }

    const dots = screen.getAllByRole('button', { name: /Go to section/i });
    // The second dot (index 1) should be active
    expect(dots[1]).toHaveAttribute('aria-current', 'true');
  });
});
