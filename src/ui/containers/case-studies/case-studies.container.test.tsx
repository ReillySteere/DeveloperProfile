import React from 'react';
import { render, screen, waitFor, fireEvent } from 'ui/test-utils';
import { server, createCaseStudyHandlers } from 'ui/test-utils/msw';
import { http, HttpResponse } from 'msw';
import CaseStudiesContainer from './case-studies.container';
import CaseStudyDetailContainer from './case-study-detail.container';
import { CaseStudyEditor } from './views/CaseStudyEditor';
import { DiagramViewer, CodeComparisonViewer } from './components';
import { CaseStudy, CaseStudyDiagram, CodeComparison } from 'shared/types';
import {
  useCreateCaseStudy,
  useUpdateCaseStudy,
  useDeleteCaseStudy,
} from './hooks/useCaseStudies';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';

// Mock remark-gfm
jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => () => {},
}));

// Mock react-syntax-highlighter
jest.mock('react-syntax-highlighter', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const PrismLight = ({ children }: any) =>
    React.createElement('pre', null, children);
  PrismLight.registerLanguage = jest.fn();
  return {
    PrismLight,
  };
});

jest.mock(
  'react-syntax-highlighter/dist/cjs/languages/prism/typescript',
  () => ({}),
);
jest.mock('react-syntax-highlighter/dist/cjs/languages/prism/bash', () => ({}));
jest.mock('react-syntax-highlighter/dist/cjs/languages/prism/json', () => ({}));
jest.mock(
  'react-syntax-highlighter/dist/cjs/languages/prism/markdown',
  () => ({}),
);
jest.mock('react-syntax-highlighter/dist/cjs/styles/prism', () => ({
  oneDark: {},
}));

// Mock mermaid
jest.mock('mermaid', () => ({
  initialize: jest.fn(),
  render: jest.fn().mockResolvedValue({ svg: '<svg>mock</svg>' }),
}));

// Mock react-markdown
jest.mock('react-markdown', () => (props: any) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return React.createElement(
    'div',
    { 'data-testid': 'markdown' },
    props.children,
  );
});

// Mock router hooks
const mockUseParams = jest.fn();

jest.mock('@tanstack/react-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const actual = jest.requireActual('@tanstack/react-router');
  return {
    ...actual,
    useParams: (opts: any) => mockUseParams(opts) || {},
    useNavigate: () => jest.fn(),
    createFileRoute: () => () => () => null,
    Link: (props: any) =>
      React.createElement('a', { ...props, href: props.to }, props.children),
  };
});

const mockProject = {
  id: '1',
  title: 'Test Project',
  shortDescription: 'A test project',
  role: 'Lead Developer',
  requirements: ['Feature 1', 'Feature 2'],
  execution: ['Step 1', 'Step 2'],
  results: ['Result 1', 'Result 2'],
  technologies: ['React', 'TypeScript', 'Node.js'],
  startDate: '2023-01-01',
};

const mockCaseStudies: CaseStudy[] = [
  {
    id: '1',
    slug: 'test-case-study',
    projectId: '1',
    project: mockProject,
    problemContext: '# The Problem\n\nLegacy system issues.',
    challenges: ['Technical debt', 'Scalability concerns'],
    approach: '# Our Approach\n\nModernization strategy.',
    phases: [
      {
        name: 'Discovery',
        description: 'Research and analysis',
        duration: '2 weeks',
      },
      { name: 'Implementation', description: 'Build and test' },
    ],
    keyDecisions: ['Adopted TypeScript', 'Event-driven architecture'],
    outcomeSummary: '# The Results\n\nSignificant improvements.',
    metrics: [
      { label: 'Test Coverage', before: '60%', after: '95%' },
      { label: 'Build Time', after: '30s', description: 'Down from 5 minutes' },
    ],
    learnings: ['Testing investment pays off', 'Documentation matters'],
    published: true,
  },
];

const mockCaseStudyWithDiagramsAndCode: CaseStudy = {
  ...mockCaseStudies[0],
  diagrams: [
    { type: 'mermaid', content: 'graph TD; A-->B;', caption: 'Flow diagram' },
    { type: 'image', content: '/path/to/arch.png', caption: 'Architecture' },
  ],
  codeComparisons: [
    {
      title: 'Error Handling',
      description: 'Improved error handling',
      language: 'typescript',
      before: 'try {} catch {}',
      after: 'try {} catch (e) { log(e); }',
    },
  ],
};

const mockCaseStudy = mockCaseStudies[0];

// Test component that exercises mutation hooks
function MutationTestComponent() {
  const createMutation = useCreateCaseStudy();
  const updateMutation = useUpdateCaseStudy();
  const deleteMutation = useDeleteCaseStudy();

  return (
    <div>
      <button
        onClick={() =>
          createMutation.mutate({
            slug: 'new-case-study',
            projectId: '1',
            problemContext: 'New problem',
            challenges: [],
            approach: 'New approach',
            phases: [],
            keyDecisions: [],
            outcomeSummary: 'New outcome',
            metrics: [],
            learnings: [],
            published: true,
          })
        }
      >
        Create
      </button>
      <button
        onClick={() =>
          updateMutation.mutate({
            id: '1',
            data: { problemContext: 'Updated problem' },
          })
        }
      >
        Update
      </button>
      <button onClick={() => deleteMutation.mutate('1')}>Delete</button>
      {createMutation.isSuccess && <span>Created</span>}
      {updateMutation.isSuccess && <span>Updated</span>}
      {deleteMutation.isSuccess && <span>Deleted</span>}
    </div>
  );
}

describe('Case Studies Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset MSW handlers to defaults
    server.resetHandlers();
    // Set up default case study handlers with our mock data
    server.use(...createCaseStudyHandlers({ caseStudies: mockCaseStudies }));

    // Default: Slug present
    mockUseParams.mockReturnValue({ slug: 'test-case-study' });

    // Default: Not authenticated
    useAuthStore.setState({ isAuthenticated: false, token: null, user: null });
  });

  describe('CaseStudiesContainer (List View)', () => {
    it('renders case studies list', async () => {
      render(<CaseStudiesContainer />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
      expect(screen.getByText('Lead Developer')).toBeInTheDocument();
    });

    it('renders page title', async () => {
      render(<CaseStudiesContainer />);

      expect(screen.getByText('Case Studies')).toBeInTheDocument();
    });

    it('renders technology badges', async () => {
      render(<CaseStudiesContainer />);

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
    });

    it('renders empty state when no case studies', async () => {
      server.use(...createCaseStudyHandlers({ caseStudies: [] }));

      render(<CaseStudiesContainer />);

      await waitFor(() => {
        expect(
          screen.getByText('No case studies available yet.'),
        ).toBeInTheDocument();
      });
    });

    it('renders error state', async () => {
      server.use(
        http.get('/api/case-studies', () => {
          return HttpResponse.json(
            { message: 'Failed to fetch' },
            { status: 500 },
          );
        }),
      );

      render(<CaseStudiesContainer />);

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('renders loading state', async () => {
      // Use delay to keep loading state visible
      server.use(...createCaseStudyHandlers({ delayMs: 10000 }));

      render(<CaseStudiesContainer />);

      // Loading skeleton should be present
      expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
    });

    it('shows create button when authenticated', async () => {
      useAuthStore.setState({ isAuthenticated: true });

      render(<CaseStudiesContainer />);

      await waitFor(() => {
        expect(screen.getByText('Create Case Study')).toBeInTheDocument();
      });
    });

    it('does not show create button when not authenticated', async () => {
      useAuthStore.setState({ isAuthenticated: false });

      render(<CaseStudiesContainer />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      expect(screen.queryByText('Create Case Study')).not.toBeInTheDocument();
    });

    it('shows alert when create button is clicked', async () => {
      useAuthStore.setState({ isAuthenticated: true });
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<CaseStudiesContainer />);

      await waitFor(() => {
        expect(screen.getByText('Create Case Study')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create Case Study'));

      expect(alertSpy).toHaveBeenCalledWith('Create form coming soon');
      alertSpy.mockRestore();
    });
  });

  describe('CaseStudyDetailContainer (Detail View)', () => {
    it('renders case study detail view', async () => {
      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
      expect(screen.getByText('Lead Developer')).toBeInTheDocument();
    });

    it('renders back link', async () => {
      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('← Back to Case Studies')).toBeInTheDocument();
      });
    });

    it('renders projects link', async () => {
      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('View Projects →')).toBeInTheDocument();
      });
    });

    it('renders section titles', async () => {
      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('The Problem')).toBeInTheDocument();
      });
      expect(screen.getByText('The Solution')).toBeInTheDocument();
      expect(screen.getByText('The Outcome')).toBeInTheDocument();
    });

    it('renders challenges list', async () => {
      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Key Challenges')).toBeInTheDocument();
      });
      expect(screen.getByText('Technical debt')).toBeInTheDocument();
      expect(screen.getByText('Scalability concerns')).toBeInTheDocument();
    });

    it('renders implementation phases', async () => {
      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Implementation Phases')).toBeInTheDocument();
      });
      expect(screen.getByText('Discovery')).toBeInTheDocument();
      expect(screen.getByText('Research and analysis')).toBeInTheDocument();
      expect(screen.getByText('2 weeks')).toBeInTheDocument();
      expect(screen.getByText('Implementation')).toBeInTheDocument();
      expect(screen.getByText('Build and test')).toBeInTheDocument();
    });

    it('renders key decisions', async () => {
      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Key Decisions')).toBeInTheDocument();
      });
      expect(screen.getByText('Adopted TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Event-driven architecture')).toBeInTheDocument();
    });

    it('renders metrics grid', async () => {
      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Impact Metrics')).toBeInTheDocument();
      });
      expect(screen.getByText('Test Coverage')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('Build Time')).toBeInTheDocument();
      expect(screen.getByText('30s')).toBeInTheDocument();
      expect(screen.getByText('Down from 5 minutes')).toBeInTheDocument();
    });

    it('renders learnings list', async () => {
      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Key Learnings')).toBeInTheDocument();
      });
      expect(
        screen.getByText('Testing investment pays off'),
      ).toBeInTheDocument();
      expect(screen.getByText('Documentation matters')).toBeInTheDocument();
    });

    it('renders technology badges', async () => {
      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('renders error state', async () => {
      server.use(
        http.get('/api/case-studies/:slug', () => {
          return HttpResponse.json(
            { message: 'Failed to fetch' },
            { status: 500 },
          );
        }),
      );

      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('fetches case study by slug from params', async () => {
      mockUseParams.mockReturnValue({ slug: 'my-case-study' });
      // Set up handler to return mockCaseStudy for the specific slug
      server.use(
        ...createCaseStudyHandlers({ singleCaseStudy: mockCaseStudy }),
      );

      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
    });

    it('hides optional sections when data is empty', async () => {
      const minimalCaseStudy: CaseStudy = {
        ...mockCaseStudy,
        challenges: [],
        phases: [],
        keyDecisions: [],
        metrics: [],
        learnings: [],
      };
      server.use(
        ...createCaseStudyHandlers({ singleCaseStudy: minimalCaseStudy }),
      );

      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Optional sections should not be rendered
      expect(screen.queryByText('Key Challenges')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Implementation Phases'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Key Decisions')).not.toBeInTheDocument();
      expect(screen.queryByText('Impact Metrics')).not.toBeInTheDocument();
      expect(screen.queryByText('Key Learnings')).not.toBeInTheDocument();
    });

    it('shows edit button when authenticated', async () => {
      useAuthStore.setState({ isAuthenticated: true });

      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Edit Case Study')).toBeInTheDocument();
      });
    });

    it('does not show edit button when not authenticated', async () => {
      useAuthStore.setState({ isAuthenticated: false });

      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      expect(screen.queryByText('Edit Case Study')).not.toBeInTheDocument();
    });

    it('switches to edit mode when edit button is clicked', async () => {
      useAuthStore.setState({ isAuthenticated: true });

      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Edit Case Study')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Case Study'));

      // Editor should now be visible with section tabs
      await waitFor(() => {
        expect(screen.getByText('Problem')).toBeInTheDocument();
      });
      expect(screen.getByText('Solution')).toBeInTheDocument();
      expect(screen.getByText('Outcome')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('returns to detail view when cancel is clicked in editor', async () => {
      useAuthStore.setState({ isAuthenticated: true });

      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Edit Case Study')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Case Study'));

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      // Should return to detail view
      await waitFor(() => {
        expect(screen.getByText('Edit Case Study')).toBeInTheDocument();
      });
      expect(screen.getByText('The Problem')).toBeInTheDocument();
    });

    it('saves changes and calls update API', async () => {
      useAuthStore.setState({ isAuthenticated: true });

      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Edit Case Study')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Case Study'));

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Changes'));

      // After save, detail view should be shown again
      await waitFor(() => {
        expect(screen.getByText('Edit Case Study')).toBeInTheDocument();
      });
    });

    it('renders editor with section tabs for navigation', async () => {
      useAuthStore.setState({ isAuthenticated: true });

      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Edit Case Study')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Case Study'));

      // Problem section should be active by default
      await waitFor(() => {
        expect(
          screen.getByLabelText('Problem Context (Markdown)'),
        ).toBeInTheDocument();
      });

      // Click Solution tab
      fireEvent.click(screen.getByText('Solution'));

      await waitFor(() => {
        expect(
          screen.getByLabelText('Approach (Markdown)'),
        ).toBeInTheDocument();
      });

      // Click Outcome tab
      fireEvent.click(screen.getByText('Outcome'));

      await waitFor(() => {
        expect(
          screen.getByLabelText('Outcome Summary (Markdown)'),
        ).toBeInTheDocument();
      });
    });

    it('renders diagrams section when diagrams are present', async () => {
      server.use(
        ...createCaseStudyHandlers({
          singleCaseStudy: mockCaseStudyWithDiagramsAndCode,
        }),
      );

      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Architecture Diagrams')).toBeInTheDocument();
      });
    });

    it('renders code evolution section when code comparisons are present', async () => {
      server.use(
        ...createCaseStudyHandlers({
          singleCaseStudy: mockCaseStudyWithDiagramsAndCode,
        }),
      );

      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Code Evolution')).toBeInTheDocument();
      });
      expect(screen.getByText('Error Handling')).toBeInTheDocument();
    });

    it('does not render diagrams section when diagrams is undefined', async () => {
      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      expect(
        screen.queryByText('Architecture Diagrams'),
      ).not.toBeInTheDocument();
    });

    it('does not render code evolution section when codeComparisons is undefined', async () => {
      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      expect(screen.queryByText('Code Evolution')).not.toBeInTheDocument();
    });

    it('does not save when case study has no id', async () => {
      // Case study without id
      const caseStudyWithoutId = { ...mockCaseStudy, id: '' };
      server.use(
        ...createCaseStudyHandlers({ singleCaseStudy: caseStudyWithoutId }),
      );
      useAuthStore.setState({ isAuthenticated: true });

      render(<CaseStudyDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Edit Case Study')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Case Study'));

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Changes'));

      // Should remain in edit mode since save doesn't proceed without id
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  describe('Mutation Hooks', () => {
    it('creates a case study', async () => {
      render(<MutationTestComponent />);

      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.getByText('Created')).toBeInTheDocument();
      });
    });

    it('updates a case study', async () => {
      render(<MutationTestComponent />);

      fireEvent.click(screen.getByText('Update'));

      await waitFor(() => {
        expect(screen.getByText('Updated')).toBeInTheDocument();
      });
    });

    it('deletes a case study', async () => {
      render(<MutationTestComponent />);

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(screen.getByText('Deleted')).toBeInTheDocument();
      });
    });
  });

  describe('CaseStudyEditor', () => {
    const mockOnSave = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
      mockOnSave.mockClear();
      mockOnCancel.mockClear();
    });

    it('renders all section tabs', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText('Problem')).toBeInTheDocument();
      expect(screen.getByText('Solution')).toBeInTheDocument();
      expect(screen.getByText('Outcome')).toBeInTheDocument();
    });

    it('renders problem section by default', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      expect(
        screen.getByLabelText('Problem Context (Markdown)'),
      ).toBeInTheDocument();
      expect(screen.getByText('Challenges')).toBeInTheDocument();
    });

    it('switches to solution section when tab is clicked', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Solution'));

      expect(screen.getByLabelText('Approach (Markdown)')).toBeInTheDocument();
      expect(screen.getByText('Implementation Phases')).toBeInTheDocument();
      expect(screen.getByText('Key Decisions')).toBeInTheDocument();
    });

    it('switches to outcome section when tab is clicked', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Outcome'));

      expect(
        screen.getByLabelText('Outcome Summary (Markdown)'),
      ).toBeInTheDocument();
      expect(screen.getByText('Impact Metrics')).toBeInTheDocument();
      expect(screen.getByText('Learnings')).toBeInTheDocument();
    });

    it('toggles preview mode', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Preview Mode'));

      expect(screen.getByText('Problem Context')).toBeInTheDocument();
      expect(screen.getByText('Approach')).toBeInTheDocument();
      expect(screen.getByText('Outcome Summary')).toBeInTheDocument();
      expect(screen.getByText('Back to Edit')).toBeInTheDocument();
    });

    it('returns to edit mode from preview', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Preview Mode'));
      fireEvent.click(screen.getByText('Back to Edit'));

      expect(
        screen.getByLabelText('Problem Context (Markdown)'),
      ).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('calls onSave with form data when submitted', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Save Changes'));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'test-case-study',
          problemContext: '# The Problem\n\nLegacy system issues.',
        }),
      );
    });

    it('handles text input changes', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const slugInput = screen.getByLabelText('Slug');
      fireEvent.change(slugInput, { target: { value: 'new-slug' } });

      expect(slugInput).toHaveValue('new-slug');
    });

    it('handles textarea changes', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const textarea = screen.getByLabelText('Problem Context (Markdown)');
      fireEvent.change(textarea, { target: { value: 'Updated content' } });

      expect(textarea).toHaveValue('Updated content');
    });

    it('handles checkbox changes', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('adds a new challenge', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const initialChallenges = screen.getAllByPlaceholderText(/Challenge \d+/);
      expect(initialChallenges).toHaveLength(2);

      fireEvent.click(screen.getByText('+ Add Challenge'));

      const updatedChallenges = screen.getAllByPlaceholderText(/Challenge \d+/);
      expect(updatedChallenges).toHaveLength(3);
    });

    it('removes a challenge', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);

      const challenges = screen.getAllByPlaceholderText(/Challenge \d+/);
      expect(challenges).toHaveLength(1);
    });

    it('changes a challenge value', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      const challengeInputs = screen.getAllByPlaceholderText(/Challenge \d+/);
      fireEvent.change(challengeInputs[0], {
        target: { value: 'New challenge text' },
      });

      expect(challengeInputs[0]).toHaveValue('New challenge text');
    });

    it('adds a new phase', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Solution'));

      const initialPhases = screen.getAllByPlaceholderText('Phase name');
      expect(initialPhases).toHaveLength(2);

      fireEvent.click(screen.getByText('+ Add Phase'));

      const updatedPhases = screen.getAllByPlaceholderText('Phase name');
      expect(updatedPhases).toHaveLength(3);
    });

    it('removes a phase', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Solution'));

      const removePhaseButtons = screen.getAllByText('Remove Phase');
      fireEvent.click(removePhaseButtons[0]);

      const phases = screen.getAllByPlaceholderText('Phase name');
      expect(phases).toHaveLength(1);
    });

    it('changes phase fields', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Solution'));

      const phaseNameInputs = screen.getAllByPlaceholderText('Phase name');
      fireEvent.change(phaseNameInputs[0], { target: { value: 'New Phase' } });
      expect(phaseNameInputs[0]).toHaveValue('New Phase');

      const durationInputs = screen.getAllByPlaceholderText(
        'Duration (e.g., 4 weeks)',
      );
      fireEvent.change(durationInputs[0], { target: { value: '3 weeks' } });
      expect(durationInputs[0]).toHaveValue('3 weeks');

      const descriptionInputs =
        screen.getAllByPlaceholderText('Phase description');
      fireEvent.change(descriptionInputs[0], {
        target: { value: 'New description' },
      });
      expect(descriptionInputs[0]).toHaveValue('New description');
    });

    it('adds a new metric', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Outcome'));

      const initialMetrics = screen.getAllByPlaceholderText('Metric label');
      expect(initialMetrics).toHaveLength(2);

      fireEvent.click(screen.getByText('+ Add Metric'));

      const updatedMetrics = screen.getAllByPlaceholderText('Metric label');
      expect(updatedMetrics).toHaveLength(3);
    });

    it('removes a metric', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Outcome'));

      const removeMetricButtons = screen.getAllByText('Remove Metric');
      fireEvent.click(removeMetricButtons[0]);

      const metrics = screen.getAllByPlaceholderText('Metric label');
      expect(metrics).toHaveLength(1);
    });

    it('changes metric fields', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Outcome'));

      const labelInputs = screen.getAllByPlaceholderText('Metric label');
      fireEvent.change(labelInputs[0], { target: { value: 'New Label' } });
      expect(labelInputs[0]).toHaveValue('New Label');

      const beforeInputs = screen.getAllByPlaceholderText(
        'Before value (optional)',
      );
      fireEvent.change(beforeInputs[0], { target: { value: '50%' } });
      expect(beforeInputs[0]).toHaveValue('50%');

      const afterInputs = screen.getAllByPlaceholderText('After value');
      fireEvent.change(afterInputs[0], { target: { value: '100%' } });
      expect(afterInputs[0]).toHaveValue('100%');

      const descInputs = screen.getAllByPlaceholderText(
        'Description (optional)',
      );
      fireEvent.change(descInputs[0], { target: { value: 'Improved' } });
      expect(descInputs[0]).toHaveValue('Improved');
    });

    it('adds and manages key decisions', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Solution'));

      const initialDecisions =
        screen.getAllByPlaceholderText(/Key Decision \d+/);
      expect(initialDecisions).toHaveLength(2);

      fireEvent.click(screen.getByText('+ Add Key Decision'));

      const updatedDecisions =
        screen.getAllByPlaceholderText(/Key Decision \d+/);
      expect(updatedDecisions).toHaveLength(3);
    });

    it('adds and manages learnings', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Outcome'));

      const initialLearnings = screen.getAllByPlaceholderText(/Learning \d+/);
      expect(initialLearnings).toHaveLength(2);

      fireEvent.click(screen.getByText('+ Add Learning'));

      const updatedLearnings = screen.getAllByPlaceholderText(/Learning \d+/);
      expect(updatedLearnings).toHaveLength(3);
    });

    it('filters out empty items when saving', () => {
      const caseStudyWithEmptyItems: CaseStudy = {
        ...mockCaseStudy,
        challenges: ['Valid challenge', ''],
        phases: [
          { name: 'Valid Phase', description: 'Description' },
          { name: '', description: '' },
        ],
        keyDecisions: ['Valid decision', ''],
        metrics: [
          { label: 'Valid Metric', after: '100%' },
          { label: '', after: '' },
        ],
        learnings: ['Valid learning', ''],
      };

      render(
        <CaseStudyEditor
          caseStudy={caseStudyWithEmptyItems}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Save Changes'));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          challenges: ['Valid challenge'],
          phases: [{ name: 'Valid Phase', description: 'Description' }],
          keyDecisions: ['Valid decision'],
          metrics: [{ label: 'Valid Metric', after: '100%' }],
          learnings: ['Valid learning'],
        }),
      );
    });

    it('shows challenges in preview mode', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      fireEvent.click(screen.getByText('Preview Mode'));

      expect(screen.getByText('Technical debt')).toBeInTheDocument();
      expect(screen.getByText('Scalability concerns')).toBeInTheDocument();
    });

    it('updates form data when caseStudy prop changes', () => {
      const { rerender } = render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByLabelText('Slug')).toHaveValue('test-case-study');

      const updatedCaseStudy = { ...mockCaseStudy, slug: 'updated-slug' };
      rerender(
        <CaseStudyEditor
          caseStudy={updatedCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByLabelText('Slug')).toHaveValue('updated-slug');
    });

    it('handles case study with diagrams and codeComparisons', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudyWithDiagramsAndCode}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      // Editor should render without errors
      expect(screen.getByLabelText('Slug')).toHaveValue('test-case-study');
    });

    it('clicks problem section tab when already on problem', () => {
      render(
        <CaseStudyEditor
          caseStudy={mockCaseStudy}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />,
      );

      // Problem is already active, click it again
      fireEvent.click(screen.getByText('Problem'));

      // Should still show problem section
      expect(
        screen.getByLabelText('Problem Context (Markdown)'),
      ).toBeInTheDocument();
    });
  });

  describe('DiagramViewer', () => {
    it('returns null for empty diagrams array', () => {
      const { container } = render(<DiagramViewer diagrams={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders mermaid diagrams', async () => {
      const diagrams: CaseStudyDiagram[] = [
        { type: 'mermaid', content: 'graph TD; A-->B;' },
      ];

      render(<DiagramViewer diagrams={diagrams} />);

      // Wait for mermaid async render to complete
      await waitFor(() => {
        expect(document.querySelector('figure')).toBeInTheDocument();
      });
    });

    it('renders image diagrams', () => {
      const diagrams: CaseStudyDiagram[] = [
        { type: 'image', content: '/path/to/image.png' },
      ];

      render(<DiagramViewer diagrams={diagrams} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/path/to/image.png');
      expect(img).toHaveAttribute('alt', 'Diagram 1');
    });

    it('renders image with custom caption as alt text', () => {
      const diagrams: CaseStudyDiagram[] = [
        { type: 'image', content: '/path/to/image.png', caption: 'My Diagram' },
      ];

      render(<DiagramViewer diagrams={diagrams} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'My Diagram');
    });

    it('renders captions when provided', async () => {
      const diagrams: CaseStudyDiagram[] = [
        {
          type: 'mermaid',
          content: 'graph TD; A-->B;',
          caption: 'Architecture Flow',
        },
      ];

      render(<DiagramViewer diagrams={diagrams} />);

      // Wait for mermaid async render to complete
      await waitFor(() => {
        expect(screen.getByText('Architecture Flow')).toBeInTheDocument();
      });
    });

    it('renders multiple diagrams', async () => {
      const diagrams: CaseStudyDiagram[] = [
        { type: 'mermaid', content: 'graph TD; A-->B;' },
        { type: 'image', content: '/path/to/image.png' },
      ];

      render(<DiagramViewer diagrams={diagrams} />);

      // Wait for mermaid async render to complete
      await waitFor(() => {
        expect(document.querySelectorAll('figure')).toHaveLength(2);
      });
    });
  });

  describe('CodeComparisonViewer', () => {
    it('returns null for empty comparisons array', () => {
      const { container } = render(<CodeComparisonViewer comparisons={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders code comparison with title', () => {
      const comparisons: CodeComparison[] = [
        {
          title: 'Error Handling',
          language: 'typescript',
          before: 'try { } catch { }',
          after: 'try { } catch (e) { log(e); }',
        },
      ];

      render(<CodeComparisonViewer comparisons={comparisons} />);

      expect(screen.getByText('Error Handling')).toBeInTheDocument();
    });

    it('renders optional description', () => {
      const comparisons: CodeComparison[] = [
        {
          title: 'Error Handling',
          description: 'Improved error logging',
          language: 'typescript',
          before: 'try { } catch { }',
          after: 'try { } catch (e) { log(e); }',
        },
      ];

      render(<CodeComparisonViewer comparisons={comparisons} />);

      expect(screen.getByText('Improved error logging')).toBeInTheDocument();
    });

    it('renders before and after labels', () => {
      const comparisons: CodeComparison[] = [
        {
          title: 'Refactor',
          language: 'typescript',
          before: 'const x = 1;',
          after: 'const x: number = 1;',
        },
      ];

      render(<CodeComparisonViewer comparisons={comparisons} />);

      expect(screen.getByText('Before')).toBeInTheDocument();
      expect(screen.getByText('After')).toBeInTheDocument();
    });

    it('renders code content', () => {
      const comparisons: CodeComparison[] = [
        {
          title: 'Type Safety',
          language: 'typescript',
          before: 'function add(a, b) { return a + b; }',
          after: 'function add(a: number, b: number): number { return a + b; }',
        },
      ];

      render(<CodeComparisonViewer comparisons={comparisons} />);

      // Code is rendered via mocked SyntaxHighlighter (as pre)
      expect(
        screen.getByText('function add(a, b) { return a + b; }'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'function add(a: number, b: number): number { return a + b; }',
        ),
      ).toBeInTheDocument();
    });

    it('renders multiple comparisons', () => {
      const comparisons: CodeComparison[] = [
        {
          title: 'First Change',
          language: 'typescript',
          before: 'old1',
          after: 'new1',
        },
        {
          title: 'Second Change',
          language: 'typescript',
          before: 'old2',
          after: 'new2',
        },
      ];

      render(<CodeComparisonViewer comparisons={comparisons} />);

      expect(screen.getByText('First Change')).toBeInTheDocument();
      expect(screen.getByText('Second Change')).toBeInTheDocument();
    });
  });
});
