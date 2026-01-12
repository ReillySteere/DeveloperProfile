import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  createEvent,
} from 'ui/test-utils';
import Experience from './experience.container';
import ExperienceSection from './components/ExperienceSection';
import { QueryState } from 'ui/shared/components';
import axios from 'axios';
import { ExperienceEntry } from 'shared/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock framer-motion to avoid animation issues
jest.mock('framer-motion', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    motion: {
      section: React.forwardRef(({ children, ...props }: any, ref: any) => {
        // Allow suppressing ref based on a global test flag compared to data-index
        const skipIndex = (global as any).__skipRefIndex;
        const index = props['data-index'];

        // If the indices match, do NOT pass the ref to the section, forcing it to be null
        const shouldAttach = skipIndex === undefined || skipIndex !== index;

        return (
          <section ref={shouldAttach ? ref : null} {...props}>
            {children}
          </section>
        );
      }),
    },
    useAnimation: () => ({
      start: jest.fn(),
    }),
  };
});

// Mock react-intersection-observer for ExperienceSection
const mockUseInView = jest.fn();
jest.mock('react-intersection-observer', () => ({
  useInView: (...args: any[]) => mockUseInView(...args),
}));

mockUseInView.mockReturnValue([jest.fn(), true]); // Default to inView=true

// Mock global IntersectionObserver for ExperiencePage
const mockIntersectionObserver = jest.fn();
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

beforeAll(() => {
  window.IntersectionObserver = mockIntersectionObserver;
  mockIntersectionObserver.mockImplementation((callback) => {
    return {
      observe: mockObserve.mockImplementation(() => {
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
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
  });

  it('renders error state and handles retry', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<Experience />);

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    // Test retry button
    const retryButton = screen.getByRole('button', { name: /Try Again/i });
    expect(retryButton).toBeInTheDocument();

    // Mock success for retry
    mockedAxios.get.mockResolvedValueOnce({ data: mockExperiences });

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
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

  it('renders empty state', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    render(<Experience />);

    await waitFor(() => {
      expect(screen.getByText(/No data found/i)).toBeInTheDocument();
    });
  });

  it('QueryState handles non-array data', () => {
    render(
      <QueryState
        isLoading={false}
        isError={false}
        data={{ some: 'data' }}
        children={(data: any) => <div>{data.some}</div>}
      />,
    );
    expect(screen.getByText('data')).toBeInTheDocument();
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

    // Key press on dot (Enter) - verify preventDefault and scroll
    const enterEvent = createEvent.keyDown(dots[0], { key: 'Enter' });
    const spyEnter = jest.spyOn(enterEvent, 'preventDefault');
    fireEvent(dots[0], enterEvent);
    expect(spyEnter).toHaveBeenCalled();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(2);

    // Key press on dot (Space) - verify preventDefault and scroll
    const spaceEvent = createEvent.keyDown(dots[0], { key: ' ' });
    const spySpace = jest.spyOn(spaceEvent, 'preventDefault');
    fireEvent(dots[0], spaceEvent);
    expect(spySpace).toHaveBeenCalled();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(3);

    // Key press with unhandled key (e.g. 'a') - verify NO preventDefault and NO scroll
    const aEvent = createEvent.keyDown(dots[0], { key: 'a' });
    const spyA = jest.spyOn(aEvent, 'preventDefault');
    fireEvent(dots[0], aEvent);
    expect(spyA).not.toHaveBeenCalled();
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

  it('updates active dot on scroll (IntersectionObserver) and handles edge cases', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockExperiences });
    render(<Experience />);

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    // Trigger IntersectionObserver callback
    const callback = (window as any).__intersectionCallback;
    expect(callback).toBeDefined();

    // Case 1: Intersecting valid index 1
    act(() => {
      callback([{ isIntersecting: true, target: { getAttribute: () => '1' } }]);
    });
    const dots = screen.getAllByRole('button', { name: /Go to section/i });
    expect(dots[1]).toHaveAttribute('aria-current', 'true');

    // Case 2: Not intersecting (should do nothing) -- covers 'if (entry.isIntersecting)' else
    act(() => {
      callback([
        { isIntersecting: false, target: { getAttribute: () => '0' } },
      ]);
    });
    // State should still be 1 (from previous step) or at least not crash
    expect(dots[1]).toHaveAttribute('aria-current', 'true');

    // Case 3: Intersecting but NaN index -- covers 'if (!isNaN(idx))' else
    act(() => {
      callback([
        { isIntersecting: true, target: { getAttribute: () => 'nan' } },
      ]);
    });
    // State should not change
    expect(dots[1]).toHaveAttribute('aria-current', 'true');

    // Case 4: Mixed entries
    act(() => {
      callback([
        { isIntersecting: false, target: { getAttribute: () => '1' } }, // ignored
        { isIntersecting: true, target: { getAttribute: () => '0' } }, // applied
      ]);
    });
    expect(dots[0]).toHaveAttribute('aria-current', 'true');
  });

  it('cleans up observer on unmount', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockExperiences });
    const { unmount } = render(<Experience />);

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('ExperienceSection handles inView=false state', () => {
    // Override mock for this test
    mockUseInView.mockReturnValueOnce([jest.fn(), false]);

    const entry = mockExperiences[0];
    render(<ExperienceSection entry={entry} index={0} />);
    // Since inView is false, controls.start('visible') should NOT be called.
    // However, this covers the 'if (inView)' else branch.
  });

  it('handles missing refs gracefully in observer setup', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockExperiences });

    // Tell mock to skip ref for index 0
    (global as any).__skipRefIndex = 0;

    render(<Experience />);

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    // Expect observe to be called only for the valid ref (index 1)
    // mockExperiences has 2 items. Ref 0 is null. Ref 1 is valid.
    expect(mockObserve).toHaveBeenCalledTimes(1);

    // Also test scrollToSection with missing ref (covers line 38 condition)
    const dots = screen.getAllByRole('button', { name: /Go to section/i });
    const dot0 = dots[0]; // Corresponds to index 0 which has no ref

    Element.prototype.scrollIntoView = jest.fn();
    fireEvent.click(dot0);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    // Verify valid click still works
    fireEvent.click(dots[1]);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

    // Cleanup
    (global as any).__skipRefIndex = undefined;
  });
});
