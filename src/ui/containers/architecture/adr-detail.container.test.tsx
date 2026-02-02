import React from 'react';
import { render, screen, waitFor } from 'ui/test-utils';
import { server } from 'ui/test-utils/msw';
import AdrDetailContainer from './adr-detail.container';

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
  useParams: jest.fn(() => ({ slug: 'ADR-001-test-decision' })),
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

describe('AdrDetailContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset handlers after each test to avoid state leakage
    server.resetHandlers();
  });

  describe('Loading State', () => {
    it('displays loading skeleton initially', () => {
      render(<AdrDetailContainer />);
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Success State', () => {
    it('renders ADR markdown content successfully', async () => {
      render(<AdrDetailContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('markdown')).toBeInTheDocument();
      });

      // Content is rendered via ArchitectureContent (markdown)
      expect(screen.getByTestId('markdown')).toHaveTextContent('# ADR Content');
    });

    it('navigates back to architecture page via link', async () => {
      render(<AdrDetailContainer />);

      const backLink = screen.getByRole('link', {
        name: /back to architecture/i,
      });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/architecture');
    });
  });
});
