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

  // Simulate the code component usage for mermaid blocks
  if (props.components && props.components.code) {
    if (
      typeof props.children === 'string' &&
      props.children.includes('```mermaid')
    ) {
      const content = props.children.replace(/```mermaid\n|```/g, '');
      return props.components.code({
        node: {},
        className: 'language-mermaid',
        children: content,
      });
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
    markdownContent: '# Hello World Content',
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
        markdownContent: '```mermaid\ngraph TD; A-->B;\n```',
      };
      mockedAxios.get.mockResolvedValueOnce({ data: mermaidPost });

      render(<BlogPostContainer />);

      await waitFor(() => {
        const mermaidDiv = document.querySelector('.mermaid');
        expect(mermaidDiv).toBeInTheDocument();
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
