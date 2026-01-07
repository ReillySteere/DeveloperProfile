import React from 'react';
import { render, screen, waitFor, fireEvent } from 'ui/test-utils';
import BlogContainer from './blog.container';
import BlogPostContainer from './blog-post.container';
import axios from 'axios';
import { useAuth } from 'ui/signin/hooks/useAuth';
import { useAuthStore } from 'ui/shared/stores/authStore';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock useAuth
jest.mock('ui/signin/hooks/useAuth');
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
const mockNavigate = jest.fn();

jest.mock('@tanstack/react-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const actual = jest.requireActual('@tanstack/react-router');
  return {
    ...actual,
    useParams: (opts: any) => mockUseParams(opts) || {},
    useMatches: () => mockUseMatches() || [],
    useNavigate: () => mockNavigate,
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

    it('renders Outlet when child route is active', () => {
      mockUseMatches.mockReturnValue([{ routeId: '/blog/$slug' }]);

      render(<BlogContainer />);

      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('renders Outlet when create route is active', () => {
      mockUseMatches.mockReturnValue([{ routeId: '/blog/create' }]);

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

    it('updates blog post and navigates on slug change', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockPost });

      // Setup authenticated state
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        user: { username: 'test' },
        error: null,
      });
      useAuthStore.setState({
        token: 'fake-token',
        isAuthenticated: true,
        user: { username: 'test' },
      });

      // Mock update response
      mockedAxios.put.mockResolvedValueOnce({
        data: { ...mockPost, slug: 'new-slug' },
      });

      render(<BlogPostContainer />);

      // Wait for load
      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });

      // Click Edit
      fireEvent.click(screen.getByText('Edit Post'));

      // Change slug
      const slugInput = screen.getByLabelText('Slug');
      fireEvent.change(slugInput, { target: { value: 'new-slug' } });

      // Save
      fireEvent.click(screen.getByText('Save Changes'));

      // Verify API call
      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith(
          '/api/blog/1',
          expect.objectContaining({ slug: 'new-slug' }),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer fake-token',
            }),
          }),
        );
      });

      // Check navigation
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({
          to: '/blog/$slug',
          params: { slug: 'new-slug' },
        });
      });
    });

    it('handles update errors gracefully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockPost });
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        user: { username: 'test' },
        error: null,
      });
      useAuthStore.setState({
        token: 'fake-token',
        isAuthenticated: true,
        user: { username: 'test' },
      });

      // Mock failure
      // We must reject the promise for axios.put in order to trigger onError
      mockedAxios.put.mockRejectedValueOnce(new Error('Update failed'));

      // Mock console.error to avoid polluting output
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<BlogPostContainer />);

      // Load post
      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });

      // Edit and Save
      fireEvent.click(screen.getByText('Edit Post'));
      fireEvent.click(screen.getByText('Save Changes'));

      // Expect alert
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to update post');
      });

      consoleErrorSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('fails to update if no token is present', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockPost });

      // Authenticated in UI to show edit button, but store has no token
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        user: { username: 'test' },
        error: null,
      });
      // Set store to unauthenticated/no token to trigger the hook error
      useAuthStore.setState({
        token: null,
        isAuthenticated: false,
        user: null,
      });

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<BlogPostContainer />);

      // Load post
      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });

      // Edit and Save
      fireEvent.click(screen.getByText('Edit Post'));
      fireEvent.click(screen.getByText('Save Changes'));

      // Expect alert
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to update post');
      });

      // Verify the error logged was indeed the token error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update post:',
        expect.objectContaining({ message: 'No authentication token found' }),
      );

      consoleErrorSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('cancels edit mode', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockPost });
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        user: { username: 'test' },
        error: null,
      });

      render(<BlogPostContainer />);

      // Wait for load
      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });

      // Enter edit mode
      fireEvent.click(screen.getByText('Edit Post'));
      expect(screen.getByText('Save Changes')).toBeInTheDocument();

      // Cancel
      fireEvent.click(screen.getByText('Cancel'));

      // Should be back to view mode
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
      expect(screen.getByText('Edit Post')).toBeInTheDocument();
    });

    it('toggles preview mode in edit', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockPost });
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        user: { username: 'test' },
        error: null,
      });

      render(<BlogPostContainer />);

      await waitFor(() => {
        expect(screen.getByText('Edit Post')).toBeInTheDocument();
      });

      // Enter edit mode
      fireEvent.click(screen.getByText('Edit Post'));

      // Toggle Preview
      const previewButton = screen.getByText('Preview Mode');
      fireEvent.click(previewButton);

      // Should see "Edit Mode" button now
      expect(screen.getByText('Edit Mode')).toBeInTheDocument();
      // Should see preview content (using ReadBlogPost)
      expect(screen.getByText('Back to Edit')).toBeInTheDocument();

      // Go back to Edit
      fireEvent.click(screen.getByText('Back to Edit'));
      expect(screen.getByText('Preview Mode')).toBeInTheDocument();
    });

    it('updates various fields correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockPost });
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        user: { username: 'test' },
        error: null,
      });
      useAuthStore.setState({
        token: 'fake-token',
        isAuthenticated: true,
        user: { username: 'test' },
      });
      mockedAxios.put.mockResolvedValueOnce({ data: mockPost });

      render(<BlogPostContainer />);
      await waitFor(() => screen.findByText('Edit Post'));
      fireEvent.click(screen.getByText('Edit Post'));

      // Update fields
      fireEvent.change(screen.getByLabelText('Title'), {
        target: { value: 'New Title' },
      });
      fireEvent.change(screen.getByLabelText('Meta Description'), {
        target: { value: 'New Desc' },
      });
      fireEvent.change(screen.getByLabelText('Tags (comma separated)'), {
        target: { value: 'tag1, tag2' },
      });
      fireEvent.change(screen.getByLabelText('Content (Markdown)'), {
        target: { value: '# New Content' },
      });

      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith(
          '/api/blog/1',
          expect.objectContaining({
            title: 'New Title',
            metaDescription: 'New Desc',
            tags: ['tag1', 'tag2'],
            content: '# New Content',
          }),
          expect.anything(),
        );
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

    it('updates editing form when underlying post data changes', async () => {
      // 1. Initial Load
      mockedAxios.get.mockResolvedValueOnce({ data: mockPost });
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        user: { username: 'test' },
        error: null,
      });

      const { rerender } = render(<BlogPostContainer />);

      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });

      // 2. Enter Edit Mode
      fireEvent.click(screen.getByText('Edit Post'));
      const titleInput = screen.getByLabelText('Title');
      expect(titleInput).toHaveValue('Hello World');

      // 3. Simulate Route Change -> Data Change
      // Change params to trigger a refetch in useBlogPost
      mockUseParams.mockReturnValue({ slug: 'new-slug' });
      // Setup next API response
      const updatedPost = {
        ...mockPost,
        title: 'Updated Title',
        slug: 'new-slug',
      };
      mockedAxios.get.mockResolvedValueOnce({ data: updatedPost });

      // Rerender with new params (simulating router update)
      rerender(<BlogPostContainer />);

      // 4. Verification
      // The useEffect in UpdateBlogPost should detect the prop change and update the form
      await waitFor(() => {
        // We assert on the input value to confirm the form state was updated
        expect(screen.getByLabelText('Title')).toHaveValue('Updated Title');
      });
    });

    it('handles post with undefined tags', async () => {
      const postWithNoTags = { ...mockPost, tags: undefined };
      mockedAxios.get.mockResolvedValueOnce({ data: postWithNoTags });
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        user: { username: 'test' },
        error: null,
      });

      render(<BlogPostContainer />);

      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Post'));

      await waitFor(() => {
        // Explicitly check for empty value when tags are undefined
        // This covers the optional chaining branch in UpdateBlogPost
        expect(screen.getByLabelText('Tags (comma separated)')).toHaveValue('');
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
