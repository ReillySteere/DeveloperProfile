import React from 'react';
import { render, screen, waitFor } from 'ui/test-utils';
import { server, createArchitectureHandlers } from 'ui/test-utils/msw';
import ComponentDetailContainer from './component-detail.container';

// Mock react-syntax-highlighter (used by ArchitectureContent)
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

// Mock mermaid (used by ArchitectureContent)
jest.mock('mermaid', () => ({
  initialize: jest.fn(),
  render: jest.fn().mockResolvedValue({ svg: '<svg>mock</svg>' }),
}));

// Mock TanStack Router to provide slug param
jest.mock('@tanstack/react-router', () => ({
  ...jest.requireActual('@tanstack/react-router'),
  useParams: jest.fn(() => ({ slug: 'auth' })),
  Link: ({ children, to, ...props }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');
    return React.createElement('a', { href: to, ...props }, children);
  },
}));

// Mock react-markdown for simpler testing
jest.mock('react-markdown', () => (props: any) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return React.createElement(
    'div',
    { 'data-testid': 'markdown' },
    props.children || '',
  );
});

describe('ComponentDetailContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Loading State', () => {
    it('displays loading skeleton initially', () => {
      render(<ComponentDetailContainer />);
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Success State', () => {
    it('renders component doc content successfully', async () => {
      render(<ComponentDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Authentication')).toBeInTheDocument();
      });

      expect(screen.getByTestId('markdown')).toHaveTextContent(
        '# Component Content',
      );
    });

    it('displays component name as heading', async () => {
      render(<ComponentDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Authentication')).toBeInTheDocument();
      });

      const heading = screen.getByText('Authentication');
      expect(heading.tagName).toBe('H1');
    });

    it('navigates back to architecture page via link', async () => {
      render(<ComponentDetailContainer />);

      const backLink = screen.getByRole('link', {
        name: /back to architecture/i,
      });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/architecture');
    });
  });

  describe('Different Components', () => {
    it('renders different component documentation', async () => {
      // Override with different component
      server.use(
        ...createArchitectureHandlers({
          components: [
            {
              slug: 'auth',
              name: 'Blog Module',
              summary: 'Blog component description',
            },
          ],
        }),
      );

      render(<ComponentDetailContainer />);

      await waitFor(() => {
        expect(screen.getByText('Blog Module')).toBeInTheDocument();
      });
    });
  });
});
