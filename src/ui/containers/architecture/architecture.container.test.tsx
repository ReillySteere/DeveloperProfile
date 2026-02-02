import React from 'react';
import { render, screen, waitFor, fireEvent } from 'ui/test-utils';
import ArchitectureContainer from './architecture.container';
import AdrDetailContainer from './adr-detail.container';
import ComponentDetailContainer from './component-detail.container';
import DependenciesContainer from './dependencies.container';
import axios from 'axios';
import { useComponentDoc } from './hooks/useArchitecture';
import { toMermaidGraph } from './utils/toMermaidGraph';
import { transformArchitectureLink } from './components';
import type {
  AdrListItem,
  ComponentDocSummary,
  Adr,
  ComponentDoc,
  DependencyGraph,
} from 'shared/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

// Mock react-markdown to optionally invoke custom anchor component
jest.mock('react-markdown', () => (props: any) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');

  // Parse markdown links: [text](href)
  const content = props.children || '';
  const linkMatch = content.match?.(/\[([^\]]+)\]\(([^)]+)\)/);

  if (linkMatch && props.components?.a) {
    const [, text, href] = linkMatch;
    const AnchorComponent = props.components.a;
    return React.createElement(
      'div',
      { 'data-testid': 'markdown' },
      React.createElement(AnchorComponent, { href }, text),
    );
  }

  return React.createElement('div', { 'data-testid': 'markdown' }, content);
});

// Mock TanStack Router
const mockNavigate = jest.fn();
jest.mock('@tanstack/react-router', () => ({
  ...jest.requireActual('@tanstack/react-router'),
  useParams: jest.fn(() => ({ slug: 'ADR-001-test' })),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');
    return React.createElement('a', { href: to, ...props }, children);
  },
}));

const mockAdrs: AdrListItem[] = [
  {
    slug: 'ADR-001-first',
    title: 'ADR-001: First Decision',
    status: 'Accepted',
    date: 'January 10, 2026',
    number: 1,
    summary: 'This is the first decision.',
    searchText: 'adr 001 first decision this is the first decision',
  },
  {
    slug: 'ADR-002-second',
    title: 'ADR-002: Second Decision',
    status: 'Proposed',
    date: 'January 15, 2026',
    number: 2,
    summary: 'This is the second decision.',
    searchText: 'adr 002 second decision this is the second decision',
  },
  {
    slug: 'ADR-003-deprecated',
    title: 'ADR-003: Deprecated Decision',
    status: 'Deprecated',
    date: 'January 20, 2026',
    number: 3,
    summary: 'This decision was deprecated.',
    searchText: 'adr 003 deprecated decision this decision was deprecated',
  },
];

const mockComponents: ComponentDocSummary[] = [
  { slug: 'blog', name: 'Blog', summary: 'Blog component documentation.' },
  {
    slug: 'auth',
    name: 'Auth',
    summary: 'Authentication component documentation.',
  },
];

const mockAdr: Adr = {
  slug: 'ADR-001-test',
  title: 'ADR-001: Test Decision',
  status: 'Accepted',
  date: 'January 10, 2026',
  number: 1,
  content: '# ADR-001: Test Decision\n\nThis is the content.',
};

const mockComponentDoc: ComponentDoc = {
  slug: 'blog',
  name: 'Blog Component',
  summary: 'Documentation for the blog feature.',
  content: '# Blog Component\n\nDocumentation for the blog feature.',
};

const mockGraphsData = {
  generatedAt: '2026-01-18T00:00:00Z',
  ui: {
    containers: [
      {
        name: 'blog',
        label: 'Blog',
        nodes: [
          { id: 'blog', label: 'Blog' },
          { id: 'auth', label: 'Auth' },
        ],
        edges: [{ source: 'blog', target: 'auth' }],
      },
      {
        name: 'about',
        label: 'About',
        nodes: [{ id: 'about', label: 'About' }],
        edges: [],
      },
    ],
  },
  server: {
    modules: [
      {
        name: 'auth',
        label: 'Auth',
        nodes: [{ id: 'auth', label: 'Auth' }],
        edges: [],
      },
    ],
  },
};

const mockFocusedGraph = {
  name: 'blog',
  label: 'Blog',
  nodes: [
    { id: 'blog', label: 'Blog' },
    { id: 'auth', label: 'Auth' },
  ],
  edges: [{ source: 'blog', target: 'auth' }],
};

describe('ArchitectureContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render ADR list and component list', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/adrs')) {
        return Promise.resolve({ data: mockAdrs });
      }
      if (url.includes('/components')) {
        return Promise.resolve({ data: mockComponents });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<ArchitectureContainer />);

    await waitFor(() => {
      expect(screen.getByText('ADR-001: First Decision')).toBeInTheDocument();
    });

    expect(screen.getByText('ADR-002: Second Decision')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Auth')).toBeInTheDocument();
  });

  it('should filter ADRs by search query', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/adrs')) {
        return Promise.resolve({ data: mockAdrs });
      }
      if (url.includes('/components')) {
        return Promise.resolve({ data: mockComponents });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<ArchitectureContainer />);

    await waitFor(() => {
      expect(screen.getByText('ADR-001: First Decision')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search ADRs...');
    fireEvent.change(searchInput, { target: { value: 'second' } });

    await waitFor(() => {
      expect(
        screen.queryByText('ADR-001: First Decision'),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText('ADR-002: Second Decision')).toBeInTheDocument();
  });

  it('should filter ADRs by status', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/adrs')) {
        return Promise.resolve({ data: mockAdrs });
      }
      if (url.includes('/components')) {
        return Promise.resolve({ data: mockComponents });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<ArchitectureContainer />);

    await waitFor(() => {
      expect(screen.getByText('ADR-001: First Decision')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText('Filter by status');
    fireEvent.change(statusSelect, { target: { value: 'Proposed' } });

    await waitFor(() => {
      expect(
        screen.queryByText('ADR-001: First Decision'),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText('ADR-002: Second Decision')).toBeInTheDocument();
    expect(
      screen.queryByText('ADR-003: Deprecated Decision'),
    ).not.toBeInTheDocument();
  });

  it('should clear filters when clear button is clicked', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/adrs')) {
        return Promise.resolve({ data: mockAdrs });
      }
      if (url.includes('/components')) {
        return Promise.resolve({ data: mockComponents });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<ArchitectureContainer />);

    await waitFor(() => {
      expect(screen.getByText('ADR-001: First Decision')).toBeInTheDocument();
    });

    // Apply a filter
    const searchInput = screen.getByPlaceholderText('Search ADRs...');
    fireEvent.change(searchInput, { target: { value: 'second' } });

    await waitFor(() => {
      expect(
        screen.queryByText('ADR-001: First Decision'),
      ).not.toBeInTheDocument();
    });

    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('ADR-001: First Decision')).toBeInTheDocument();
    });
  });

  it('should display loading state', async () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    render(<ArchitectureContainer />);

    // QueryState shows loading skeleton
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('should display error state', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    render(<ArchitectureContainer />);

    await waitFor(() => {
      expect(screen.getAllByText(/network error/i).length).toBeGreaterThan(0);
    });
  });
});

describe('AdrDetailContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render ADR detail with markdown content', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockAdr });

    render(<AdrDetailContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('markdown')).toBeInTheDocument();
    });

    // Content is rendered via markdown (title and body are part of the markdown)
    expect(screen.getByTestId('markdown')).toHaveTextContent(
      '# ADR-001: Test Decision',
    );
  });

  it('should display back button', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockAdr });

    render(<AdrDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('← Back to Architecture')).toBeInTheDocument();
    });
  });
});

describe('ComponentDetailContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Override useParams for component slug
    jest
      .requireMock('@tanstack/react-router')
      .useParams.mockReturnValue({ slug: 'blog' });
  });

  it('should render component documentation with content', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockComponentDoc });

    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('Blog Component')).toBeInTheDocument();
    });
  });

  it('should display back button', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockComponentDoc });

    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText('← Back to Architecture')).toBeInTheDocument();
    });
  });

  it('should display loading state', async () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    render(<ComponentDetailContainer />);

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('should display error state', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Component not found'));

    render(<ComponentDetailContainer />);

    await waitFor(() => {
      expect(screen.getByText(/component not found/i)).toBeInTheDocument();
    });
  });
});

describe('DependenciesContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupMocks = () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === '/api/architecture/dependencies') {
        return Promise.resolve({ data: mockGraphsData });
      }
      if (url.includes('/api/architecture/dependencies/')) {
        return Promise.resolve({ data: mockFocusedGraph });
      }
      return Promise.reject(new Error('Not found'));
    });
  };

  it('should render dependency graph with zoom controls', async () => {
    setupMocks();

    render(<DependenciesContainer />);

    // Wait for graph to fully load (zoom controls appear when graph is rendered)
    await waitFor(() => {
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    });

    // Check zoom controls are present
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset view')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should render scope and target selectors', async () => {
    setupMocks();

    render(<DependenciesContainer />);

    await waitFor(() => {
      expect(
        screen.getByLabelText('Select dependency scope'),
      ).toBeInTheDocument();
    });

    // Check target selector is present
    expect(screen.getByLabelText(/Select container/)).toBeInTheDocument();
  });

  it('should zoom in when zoom in button is clicked', async () => {
    setupMocks();

    render(<DependenciesContainer />);

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    const zoomInButton = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInButton);

    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('should zoom out when zoom out button is clicked', async () => {
    setupMocks();

    render(<DependenciesContainer />);

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    const zoomOutButton = screen.getByLabelText('Zoom out');
    fireEvent.click(zoomOutButton);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should reset zoom and position when reset button is clicked', async () => {
    setupMocks();

    render(<DependenciesContainer />);

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    // Zoom in first
    const zoomInButton = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInButton);
    expect(screen.getByText('150%')).toBeInTheDocument();

    // Reset
    const resetButton = screen.getByLabelText('Reset view');
    fireEvent.click(resetButton);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should disable zoom out at minimum zoom level', async () => {
    setupMocks();

    render(<DependenciesContainer />);

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    const zoomOutButton = screen.getByLabelText('Zoom out');

    // Click once to reach minimum (100% -> 50%)
    fireEvent.click(zoomOutButton);

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(zoomOutButton).toBeDisabled();
  });

  it('should handle mouse wheel zoom', async () => {
    setupMocks();

    render(<DependenciesContainer />);

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    // Find the graph wrapper and simulate wheel event
    const graphWrapper = screen
      .getByText('Use mouse wheel to zoom, drag to pan')
      .closest('div')
      ?.querySelector('[style*="cursor"]');

    if (graphWrapper) {
      fireEvent.wheel(graphWrapper, { deltaY: -100 });
      expect(screen.getByText('150%')).toBeInTheDocument();
    }
  });

  it('should handle mouse drag for panning', async () => {
    setupMocks();

    render(<DependenciesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    });

    // Find the graph wrapper
    const graphWrapper = screen
      .getByText('Use mouse wheel to zoom, drag to pan')
      .closest('div')
      ?.querySelector('[style*="cursor"]');

    if (graphWrapper) {
      // Simulate drag: mousedown -> mousemove -> mouseup
      fireEvent.mouseDown(graphWrapper, {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      fireEvent.mouseMove(graphWrapper, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(graphWrapper);
    }

    // Graph should still be rendered (panning doesn't break anything)
    expect(screen.getByText('Dependency Graph')).toBeInTheDocument();
  });

  it('should handle mouse leave during drag', async () => {
    setupMocks();

    render(<DependenciesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    });

    const graphWrapper = screen
      .getByText('Use mouse wheel to zoom, drag to pan')
      .closest('div')
      ?.querySelector('[style*="cursor"]');

    if (graphWrapper) {
      fireEvent.mouseDown(graphWrapper, {
        button: 0,
        clientX: 100,
        clientY: 100,
      });
      fireEvent.mouseLeave(graphWrapper);
    }

    // Graph should still be rendered
    expect(screen.getByText('Dependency Graph')).toBeInTheDocument();
  });

  it('should ignore right-click for dragging', async () => {
    setupMocks();

    render(<DependenciesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    });

    const graphWrapper = screen
      .getByText('Use mouse wheel to zoom, drag to pan')
      .closest('div')
      ?.querySelector('[style*="cursor"]');

    if (graphWrapper) {
      // Right-click (button 2) should not start drag
      fireEvent.mouseDown(graphWrapper, {
        button: 2,
        clientX: 100,
        clientY: 100,
      });
      fireEvent.mouseMove(graphWrapper, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(graphWrapper);
    }

    expect(screen.getByText('Dependency Graph')).toBeInTheDocument();
  });

  it('should handle wheel zoom out direction', async () => {
    setupMocks();

    render(<DependenciesContainer />);

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    const graphWrapper = screen
      .getByText('Use mouse wheel to zoom, drag to pan')
      .closest('div')
      ?.querySelector('[style*="cursor"]');

    if (graphWrapper) {
      // Positive deltaY zooms out
      fireEvent.wheel(graphWrapper, { deltaY: 100 });
      expect(screen.getByText('50%')).toBeInTheDocument();
    }
  });

  it('should change scope when selector is changed', async () => {
    setupMocks();

    render(<DependenciesContainer />);

    await waitFor(() => {
      expect(
        screen.getByLabelText('Select dependency scope'),
      ).toBeInTheDocument();
    });

    const scopeSelect = screen.getByLabelText('Select dependency scope');
    fireEvent.change(scopeSelect, { target: { value: 'server' } });

    // Should update the target selector label
    await waitFor(() => {
      expect(screen.getByText('Module:')).toBeInTheDocument();
    });
  });

  it('should show empty state when graph has no dependencies', async () => {
    // Return empty graph data
    const emptyGraph = {
      name: 'blog',
      label: 'Blog',
      nodes: [],
      edges: [],
    };

    mockedAxios.get.mockImplementation((url: string) => {
      if (url === '/api/architecture/dependencies') {
        return Promise.resolve({ data: mockGraphsData });
      }
      if (url.includes('/api/architecture/dependencies/')) {
        return Promise.resolve({ data: emptyGraph });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<DependenciesContainer />);

    await waitFor(() => {
      expect(
        screen.getByText('No dependencies found for this target.'),
      ).toBeInTheDocument();
    });
  });

  it('should change target when target selector is changed', async () => {
    setupMocks();

    render(<DependenciesContainer />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select container')).toBeInTheDocument();
    });

    // Change target from 'blog' to 'about'
    const targetSelect = screen.getByLabelText('Select container');
    fireEvent.change(targetSelect, { target: { value: 'about' } });

    // Verify the selector value has changed
    await waitFor(() => {
      expect(targetSelect).toHaveValue('about');
    });
  });
});

describe('useComponentDoc hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch component documentation', async () => {
    const mockComponentDoc: ComponentDoc = {
      slug: 'blog',
      name: 'Blog',
      summary: 'Blog documentation.',
      content: '# Blog\n\nFull documentation content.',
    };

    mockedAxios.get.mockResolvedValue({ data: mockComponentDoc });

    // Create a test component that uses the hook
    const TestComponent = () => {
      const { data, isLoading } = useComponentDoc('blog');
      if (isLoading) return <div>Loading...</div>;
      return <div>{data?.name}</div>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByText('Blog')).toBeInTheDocument();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      '/api/architecture/components/blog',
    );
  });
});

describe('toMermaidGraph utility', () => {
  it('should use node id as label when no label is provided', () => {
    const graphWithNoLabel: DependencyGraph = {
      scope: 'full',
      nodes: [{ id: 'moduleA' }] as any, // Missing label
      edges: [],
      generatedAt: '2026-01-18T00:00:00Z',
    };

    const result = toMermaidGraph(graphWithNoLabel);

    expect(result).toContain('moduleA["moduleA"]');
  });

  it('should use explicit labels when provided', () => {
    const graphWithLabels: DependencyGraph = {
      scope: 'full',
      nodes: [{ id: 'moduleA', label: 'Module A' }],
      edges: [{ source: 'moduleA', target: 'moduleB' }],
      generatedAt: '2026-01-18T00:00:00Z',
    };

    const result = toMermaidGraph(graphWithLabels);

    expect(result).toContain('moduleA["Module A"]');
    expect(result).toContain('moduleA --> moduleB');
  });

  it('should sanitize node IDs with special characters', () => {
    const graphWithSpecialChars: DependencyGraph = {
      scope: 'server',
      nodes: [
        { id: 'src/server/user.entity', label: 'user.entity', type: 'server' },
        {
          id: 'src/server/auth/auth.service',
          label: 'auth.service',
          type: 'server',
        },
      ],
      edges: [
        {
          source: 'src/server/user.entity',
          target: 'src/server/auth/auth.service',
        },
      ],
      generatedAt: '2026-01-18T00:00:00Z',
    };

    const result = toMermaidGraph(graphWithSpecialChars);

    // IDs should be sanitized (dots and slashes replaced with underscores)
    expect(result).toContain('src_server_user_entity["user.entity"]');
    expect(result).toContain('src_server_auth_auth_service["auth.service"]');
    expect(result).toContain(
      'src_server_user_entity --> src_server_auth_auth_service',
    );
  });
});

describe('AdrCard edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle unknown status gracefully', async () => {
    const adrWithUnknownStatus: AdrListItem[] = [
      {
        slug: 'ADR-001-unknown',
        title: 'ADR-001: Unknown Status',
        status: 'CustomStatus' as any, // Unknown status
        date: 'January 10, 2026',
        number: 1,
        summary: 'This has a custom status.',
        searchText: 'custom status',
      },
    ];

    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/adrs')) {
        return Promise.resolve({ data: adrWithUnknownStatus });
      }
      if (url.includes('/components')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<ArchitectureContainer />);

    await waitFor(() => {
      expect(screen.getByText('ADR-001: Unknown Status')).toBeInTheDocument();
    });

    // Should still render with fallback styling
    expect(screen.getByText('CustomStatus')).toBeInTheDocument();
  });
});

describe('transformArchitectureLink', () => {
  it('transforms ADR links with ./ prefix to app routes', () => {
    const result = transformArchitectureLink(
      './ADR-001-persistent-storage-for-blog.md',
    );
    expect(result).toEqual({
      type: 'route',
      to: '/architecture/ADR-001-persistent-storage-for-blog',
    });
  });

  it('transforms ADR links with ../decisions/ prefix to app routes', () => {
    const result = transformArchitectureLink(
      '../decisions/ADR-002-sqlite-typeorm.md',
    );
    expect(result).toEqual({
      type: 'route',
      to: '/architecture/ADR-002-sqlite-typeorm',
    });
  });

  it('transforms component doc links with ./ prefix to app routes', () => {
    const result = transformArchitectureLink('./about.md');
    expect(result).toEqual({
      type: 'route',
      to: '/architecture/components/about',
    });
  });

  it('transforms component doc links with ../components/ prefix to app routes', () => {
    const result = transformArchitectureLink('../components/auth.md');
    expect(result).toEqual({
      type: 'route',
      to: '/architecture/components/auth',
    });
  });

  it('returns null for external links', () => {
    expect(transformArchitectureLink('https://github.com')).toBeNull();
    expect(transformArchitectureLink('http://example.com')).toBeNull();
  });

  it('returns null for non-markdown links', () => {
    expect(transformArchitectureLink('/blog')).toBeNull();
    expect(transformArchitectureLink('/architecture')).toBeNull();
  });

  it('handles mixed case in ADR slugs', () => {
    const result = transformArchitectureLink('./ADR-003-Mixed-Case-Title.md');
    expect(result).toEqual({
      type: 'route',
      to: '/architecture/ADR-003-Mixed-Case-Title',
    });
  });
});

describe('ArchitectureContent navigation', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      .spyOn(require('@tanstack/react-router'), 'useNavigate')
      .mockReturnValue(mockNavigate);
  });

  it('navigates when ADR link is clicked', async () => {
    const { ArchitectureContent } =
      await import('./components/ArchitectureContent');

    render(<ArchitectureContent content="See [ADR Link](./ADR-001-test.md)" />);

    const link = screen.getByText('ADR Link');
    fireEvent.click(link);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/architecture/ADR-001-test',
    });
  });
});
