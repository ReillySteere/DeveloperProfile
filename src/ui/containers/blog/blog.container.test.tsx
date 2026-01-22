import React from 'react';
import { render, screen, waitFor, fireEvent } from 'ui/test-utils';
import BlogContainer from './blog.container';
import BlogPostContainer from './blog-post.container';
import axios from 'axios';
import { useAuth } from 'ui/shared/hooks/useAuth';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock useAuth
jest.mock('ui/shared/hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

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
  const elements = [React.createElement('div', { key: 'raw' }, props.children)];

  // Simulate the code component usage if special blocks are detected
  if (
    props.components &&
    props.components.code &&
    typeof props.children === 'string'
  ) {
    if (props.children.includes('```mermaid')) {
      const regex = /```mermaid([\s\S]*?)```/g;
      let match;
      let i = 0;
      while ((match = regex.exec(props.children)) !== null) {
        const content = match[1] || '';
        elements.push(
          props.components.code({
            key: `mermaid-${i++}`,
            node: {},
            className: 'language-mermaid',
            children: content.trim(),
          }),
        );
      }
    }

    if (props.children.includes('```typescript')) {
      const content =
        props.children.match(/```typescript([\s\S]*?)```/)?.[1] || '';
      elements.push(
        props.components.code({
          key: 'ts',
          node: {},
          className: 'language-typescript',
          children: content.trim(),
        }),
      );
    }

    if (props.children.includes('```plain')) {
      const content = props.children.match(/```plain([\s\S]*?)```/)?.[1] || '';
      elements.push(
        props.components.code({
          key: 'plain',
          node: {},
          className: undefined,
          children: content.trim(),
        }),
      );
    }

    // Simulate anchor links for ADR link transformation testing
    if (props.components && props.components.a) {
      // ADR relative links
      const adrLinkMatch = props.children.match(
        /\[([^\]]+)\]\((\.\/[^)]+\.md)\)/,
      );
      if (adrLinkMatch) {
        elements.push(
          props.components.a({
            key: 'adr-link',
            href: adrLinkMatch[2],
            children: adrLinkMatch[1],
          }),
        );
      }

      // Component doc links (e.g., [about](./about.md) or [auth](../components/auth.md))
      const componentLinkMatch = props.children.match(
        /\[([^\]]+)\]\((\.\.\/components\/[^)]+\.md)\)/,
      );
      if (componentLinkMatch) {
        elements.push(
          props.components.a({
            key: 'component-link',
            href: componentLinkMatch[2],
            children: componentLinkMatch[1],
          }),
        );
      }

      // External http links
      const httpLinkMatch = props.children.match(
        /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/,
      );
      if (httpLinkMatch) {
        elements.push(
          props.components.a({
            key: 'http-link',
            href: httpLinkMatch[2],
            children: httpLinkMatch[1],
          }),
        );
      }

      // Links without href (edge case)
      if (props.children.includes('[no-href]')) {
        elements.push(
          props.components.a({
            key: 'no-href-link',
            href: undefined,
            children: 'No Href Link',
          }),
        );
      }

      // Regular relative links (not .md)
      const regularLinkMatch = props.children.match(
        /\[([^\]]+)\]\((\/[^)]+)\)/,
      );
      if (regularLinkMatch && !regularLinkMatch[2].endsWith('.md')) {
        elements.push(
          props.components.a({
            key: 'regular-link',
            href: regularLinkMatch[2],
            children: regularLinkMatch[1],
          }),
        );
      }
    }
  }

  return React.createElement('div', null, elements);
});

// Mock router hooks
const mockUseParams = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@tanstack/react-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const actual = jest.requireActual('@tanstack/react-router');
  return {
    ...actual,
    useParams: (opts: any) => mockUseParams(opts) || {},
    useNavigate: () => mockNavigate,
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
    content: `# Hello World Content

\`\`\`mermaid
graph TD;
    A-->B;
\`\`\`

\`\`\`mermaid
\`\`\`

\`\`\`typescript
const x = 1;
\`\`\`

\`\`\`plain
plain text code
\`\`\`
`,
  },
];

const mockPost = mockPosts[0];

describe('Blog Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockReset();
    mockedAxios.put.mockReset();

    // Default: Slug present
    mockUseParams.mockReturnValue({ slug: 'hello-world' });
    // Default: Not authenticated
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      user: null,
      error: null,
    });
    useAuthStore.setState({ token: null, isAuthenticated: false, user: null });

    // Mock window.alert
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('BlogContainer (List View)', () => {
    it('renders blog posts list', async () => {
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

    it('shows create button when authenticated', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockPosts });
      useAuthStore.setState({ isAuthenticated: true });

      render(<BlogContainer />);

      await waitFor(() => {
        expect(screen.getByText('Create New Post')).toBeInTheDocument();
      });
    });

    it('does not show create button when not authenticated', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockPosts });
      useAuthStore.setState({ isAuthenticated: false });

      render(<BlogContainer />);

      await waitFor(() => {
        expect(screen.queryByText('Create New Post')).not.toBeInTheDocument();
      });
    });
  });

  describe('BlogPostContainer (Detail View)', () => {
    it('renders blog post content with mixed code blocks', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockPost });

      render(<BlogPostContainer />);

      await waitFor(() => {
        // Markdown content is rendered
        expect(screen.getByText(/Hello World Content/)).toBeInTheDocument();
      });

      // Check for code blocks being processed
      expect(screen.getByText(/graph TD;/)).toBeInTheDocument();

      // Verify Mermaid component rendered and effect ran
      await waitFor(() => {
        const mermaidEl = document.querySelector('.mermaid');
        expect(mermaidEl).toBeInTheDocument();
        // The mock returns { svg: '<svg>mock</svg>' }
        expect(mermaidEl?.innerHTML).toContain('<svg>mock</svg>');
      });

      // Code might appear twice (raw + highlight), so checks length
      const codeBlocks = screen.getAllByText(/const x = 1;/);
      expect(codeBlocks.length).toBeGreaterThan(0);

      // Check plain text code block
      const plainBlocks = screen.getAllByText(/plain text code/);
      expect(plainBlocks.length).toBeGreaterThan(0);
    });

    it('renders error state', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Failed to fetch'));

      render(<BlogPostContainer />);

      await waitFor(() => {
        // QueryState renders a default error message when no specific message is provided
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('allows editing and saving when authenticated (including slug change)', async () => {
      // Mock GET for initial load AND subsequent re-fetch after mutation
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockPost })
        .mockResolvedValueOnce({
          data: { ...mockPost, tags: ['tag1', 'tag2'], slug: 'new-slug' },
        });

      mockedAxios.put.mockResolvedValueOnce({
        data: { ...mockPost, tags: ['tag1', 'tag2'], slug: 'new-slug' },
      });

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        user: { username: 'test' },
        error: null,
      });

      // Must set the store token for useUpdateBlogPost to work
      useAuthStore.setState({ token: 'fake-token' });

      render(<BlogPostContainer />);

      await waitFor(() => {
        expect(screen.getByText('Edit Post')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Post'));

      // Wait for editor to appear
      const tagsInput = await screen.findByLabelText(/Tags/i);
      const slugInput = await screen.findByLabelText(/Slug/i);

      expect(screen.getByDisplayValue('Hello World')).toBeInTheDocument();

      fireEvent.change(tagsInput, { target: { value: 'tag1, tag2' } });
      fireEvent.change(slugInput, { target: { value: 'new-slug' } });

      expect(tagsInput).toHaveValue('tag1, tag2');

      // Save changes
      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith(
          '/api/blog/1',
          expect.objectContaining({ tags: ['tag1', 'tag2'], slug: 'new-slug' }),
        );
      });

      // Should navigate because slug changed
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({
          to: '/blog/$slug',
          params: { slug: 'new-slug' },
        });
      });

      // Should exit edit mode
      await waitFor(() => {
        expect(screen.queryByLabelText(/Tags/i)).not.toBeInTheDocument();
        expect(screen.getByText('Edit Post')).toBeInTheDocument();
      });
    });

    it('can cancel editing', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockPost });
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        user: { username: 'test' },
        error: null,
      });
      useAuthStore.setState({ token: 'fake-token' });

      render(<BlogPostContainer />);

      await waitFor(() => {
        expect(screen.getByText('Edit Post')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Post'));

      // Check we are in edit mode
      await screen.findByLabelText(/Title/i);

      // Click cancel
      fireEvent.click(screen.getByText('Cancel')); // Assuming 'Cancel' is the text (Button variant="secondary" likely has default or specific text)

      // Should exit edit mode and show original view
      await waitFor(() => {
        expect(screen.queryByLabelText(/Title/i)).not.toBeInTheDocument();
        expect(screen.getByText('Edit Post')).toBeInTheDocument();
      });
    });
    it('handles editing a post with no tags', async () => {
      // Force tags to be explicitly undefined to test the fallback/safety operator
      const postNoTags = { ...mockPost, tags: undefined };

      mockedAxios.get.mockResolvedValueOnce({ data: postNoTags });
      mockedAxios.put.mockResolvedValueOnce({
        data: { ...postNoTags, tags: ['new-tag'] },
      });

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        user: { username: 'test' },
        error: null,
      });
      useAuthStore.setState({ token: 'fake-token' });

      render(<BlogPostContainer />);

      await waitFor(() => {
        expect(screen.getByText('Edit Post')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Post'));

      const tagsInput = await screen.findByLabelText(/Tags/i);
      // If undefined, it might be empty string or throw warning. We expect empty string behavior.
      expect(tagsInput).toHaveValue('');

      fireEvent.change(tagsInput, { target: { value: 'new-tag' } });
      expect(tagsInput).toHaveValue('new-tag');

      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith(
          '/api/blog/1',
          expect.objectContaining({ tags: ['new-tag'] }),
        );
      });
    });
    it('handles save error', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockPost });
      mockedAxios.put.mockRejectedValueOnce(new Error('Update failed'));

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        user: { username: 'test' },
        error: null,
      });

      useAuthStore.setState({ token: 'fake-token' });

      render(<BlogPostContainer />);

      await waitFor(() => {
        expect(screen.getByText('Edit Post')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Post'));

      const saveButton = await screen.findByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to update post');
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('BlogContent External Links', () => {
    it('opens external links in new tab', async () => {
      const postWithExternalLink = {
        ...mockPost,
        content: 'Visit [GitHub](https://github.com)',
      };

      mockedAxios.get.mockResolvedValueOnce({ data: postWithExternalLink });

      render(<BlogPostContainer />);

      await waitFor(() => {
        expect(screen.getByText('GitHub')).toBeInTheDocument();
      });

      const externalLink = screen.getByText('GitHub');
      expect(externalLink).toHaveAttribute('href', 'https://github.com');
      expect(externalLink).toHaveAttribute('target', '_blank');
      expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('handles links without href', async () => {
      const postWithNoHrefLink = {
        ...mockPost,
        content: 'Link [no-href]',
      };

      mockedAxios.get.mockResolvedValueOnce({ data: postWithNoHrefLink });

      render(<BlogPostContainer />);

      await waitFor(() => {
        expect(screen.getByText('No Href Link')).toBeInTheDocument();
      });
    });

    it('renders regular links without transformation', async () => {
      const postWithRegularLink = {
        ...mockPost,
        content: 'See [blog](/blog)',
      };

      mockedAxios.get.mockResolvedValueOnce({ data: postWithRegularLink });

      render(<BlogPostContainer />);

      await waitFor(() => {
        expect(screen.getByText('blog')).toBeInTheDocument();
      });

      const regularLink = screen.getByText('blog');
      expect(regularLink).toHaveAttribute('href', '/blog');
    });
  });
});
