import React from 'react';
import { render, screen, waitFor } from 'ui/test-utils';
import BlogContainer from './blog.container';
import BlogPostContainer from './blog-post.container';
import axios from 'axios';

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

// Mock react-markdown to avoid ESM issues
jest.mock('react-markdown', () => (props: any) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');

  // Simulate the code component usage
  if (props.components && props.components.code) {
    if (typeof props.children === 'string') {
      if (props.children.includes('```mermaid')) {
        const content = props.children.replace(/```mermaid\n|```/g, '');
        return props.components.code({
          node: {},
          className: 'language-mermaid',
          children: content,
        });
      } else if (props.children.includes('```typescript')) {
        const content = props.children.replace(/```typescript\n|```/g, '');
        return props.components.code({
          node: {},
          className: 'language-typescript',
          children: content,
        });
      } else if (props.children.includes('`inline`')) {
        return props.components.code({
          node: {},
          className: undefined,
          children: 'inline',
        });
      }
    }
  }

  return React.createElement('div', null, props.children);
});

// Mock router hooks
const mockUseMatches = jest.fn();
const mockUseParams = jest.fn();

jest.mock('@tanstack/react-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const actual = jest.requireActual('@tanstack/react-router');
  return {
    ...actual,
    useParams: (opts: any) => mockUseParams(opts) || {},
    useMatches: () => mockUseMatches() || [],
    Outlet: () => <div data-testid="outlet" />,
    createFileRoute: () => () => () => null,
    Link: (props: any) => React.createElement('a', props, props.children),
  };
});

const mockPosts = [
  {
    id: '1',
    slug: 'hello-world',
    title: 'Hello World',
    metaDescription: 'Description',
    publishedAt: new Date().toISOString(),
    tags: ['test'],
    content: '# Hello World Content',
  },
];

const mockPost = mockPosts[0];

describe('Blog Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: No child route active
    mockUseMatches.mockReturnValue([]);
    // Default: Slug present
    mockUseParams.mockReturnValue({ slug: 'hello-world' });
  });

  describe('BlogContainer (List View)', () => {
    it('renders blog posts list when no child route is active', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockPosts });

      render(
        <React.Fragment>
          <BlogContainer />
        </React.Fragment>,
      );

      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/blog');
    });

    it('renders Outlet when child route is active', () => {
      mockUseMatches.mockReturnValue([{ routeId: '/blog/$slug' }]);

      render(<BlogContainer />);

      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });
  });

  describe('BlogPostContainer (Detail View)', () => {
    it('renders blog post content', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockPost });

      render(<BlogPostContainer />);

      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });
      // With our simple mock, '# Hello World Content' should be rendered as text
      expect(screen.getByText('# Hello World Content')).toBeInTheDocument();
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/blog/hello-world');
    });

    it('renders mermaid diagrams', async () => {
      const mermaidPost = {
        ...mockPost,
        content: '```mermaid\ngraph TD; A-->B;\n```',
      };
      mockedAxios.get.mockResolvedValueOnce({ data: mermaidPost });

      render(<BlogPostContainer />);

      await waitFor(() => {
        const mermaidDiv = document.querySelector('.mermaid');
        expect(mermaidDiv).toBeInTheDocument();
      });
    });

    it('renders syntax highlighted code blocks', async () => {
      const codePost = {
        ...mockPost,
        content: '```typescript\nconst x = 1;\n```',
      };
      mockedAxios.get.mockResolvedValueOnce({ data: codePost });

      render(<BlogPostContainer />);

      await waitFor(() => {
        // SyntaxHighlighter mock renders a 'pre'
        expect(document.querySelector('pre')).toBeInTheDocument();
        expect(screen.getByText('const x = 1;')).toBeInTheDocument();
      });
    });

    it('renders inline code', async () => {
      const inlinePost = {
        ...mockPost,
        content: 'This is `inline` code.',
      };
      mockedAxios.get.mockResolvedValueOnce({ data: inlinePost });

      render(<BlogPostContainer />);

      await waitFor(() => {
        expect(screen.getByText('inline')).toBeInTheDocument();
        // Should render a 'code' tag, not 'pre'
        // Note: SyntaxHighlighter mock renders 'pre', regular code renders 'code'
        const codeElement = document.querySelector('code');
        expect(codeElement).toBeInTheDocument();
        // Ensure it's not inside a pre (which would be SyntaxHighlighter)
        expect(codeElement?.closest('pre')).toBeNull();
      });
    });

    it('does not fetch if slug is missing', async () => {
      mockUseParams.mockReturnValue({}); // No slug

      render(<BlogPostContainer />);

      // Wait a bit to ensure no fetch happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });
});
