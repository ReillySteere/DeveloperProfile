import React from 'react';
import { render, screen, waitFor, fireEvent } from 'ui/test-utils';
import CreateBlogPostContainer from './create-blog-post.container';
import axios from 'axios';
import { useAuthStore } from 'ui/shared/stores/authStore';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock router hooks
const mockNavigate = jest.fn();

jest.mock('@tanstack/react-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    useNavigate: () => mockNavigate,
    Link: (props: any) => React.createElement('a', props, props.children),
  };
});

// Mock react-markdown and friends to avoid ESM issues if they are imported by UpdateBlogPost -> ReadBlogPost
jest.mock('react-markdown', () => (props: any) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return React.createElement('div', null, props.children);
});

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

jest.mock('mermaid', () => ({
  initialize: jest.fn(),
  render: jest.fn().mockResolvedValue({ svg: '<svg>mock</svg>' }),
}));

describe('CreateBlogPostContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ isAuthenticated: false, token: null });
  });

  it('redirects to /blog if not authenticated', async () => {
    render(<CreateBlogPostContainer />);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/blog' });
    });
  });

  it('renders create form if authenticated', async () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'fake-token' });
    render(<CreateBlogPostContainer />);

    expect(screen.getByText('Create New Blog Post')).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
  });

  it('submits new post and navigates on success', async () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'fake-token' });
    const newPost = {
      id: 'new-id',
      title: 'New Post',
      slug: 'new-post',
      content: 'New Content',
      metaDescription: 'Meta',
      tags: ['tag1'],
      publishedAt: new Date().toISOString(),
    };
    mockedAxios.post.mockResolvedValueOnce({ data: newPost });

    render(<CreateBlogPostContainer />);

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'New Post' },
    });
    fireEvent.change(screen.getByLabelText(/Slug/i), {
      target: { value: 'new-post' },
    });
    fireEvent.change(screen.getByLabelText(/Meta Description/i), {
      target: { value: 'Meta' },
    });
    fireEvent.change(screen.getByLabelText(/Tags/i), {
      target: { value: 'tag1' },
    });
    fireEvent.change(screen.getByLabelText(/Content/i), {
      target: { value: 'New Content' },
    });

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/blog',
        expect.objectContaining({
          title: 'New Post',
          slug: 'new-post',
          content: 'New Content',
        }),
        expect.any(Object),
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/blog/$slug',
        params: { slug: newPost.slug },
      });
    });
  });

  it('logs error on failure', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    useAuthStore.setState({ isAuthenticated: true, token: 'fake-token' });
    mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

    render(<CreateBlogPostContainer />);

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Fail Post' },
    });
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Slug/i), {
      target: { value: 'fail' },
    });
    fireEvent.change(screen.getByLabelText(/Meta Description/i), {
      target: { value: 'desc' },
    });
    fireEvent.change(screen.getByLabelText(/Content/i), {
      target: { value: 'cnt' },
    });

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create blog post:',
        expect.any(Error),
      );
    });
    consoleSpy.mockRestore();
  });
});
