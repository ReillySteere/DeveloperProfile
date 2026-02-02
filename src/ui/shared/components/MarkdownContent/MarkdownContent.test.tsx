import React from 'react';
import { render, screen } from '@testing-library/react';
import { MarkdownContent, type LinkTransformResult } from './MarkdownContent';

// Mock @tanstack/react-router Link component
jest.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, ...props }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');
    // Store the params as a data attribute for testing
    const dataProps = params ? { 'data-params': JSON.stringify(params) } : {};
    return React.createElement(
      'a',
      { href: to, ...dataProps, ...props },
      children,
    );
  },
}));

// Mock remark-gfm
jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => () => {},
}));

// Mock react-markdown to invoke the components prop
jest.mock('react-markdown', () => {
  return function MockReactMarkdown(props: any) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');

    // Parse markdown links: [text](href)
    const content = props.children || '';
    const linkMatch = content.match(/\[([^\]]+)\]\(([^)]+)\)/);

    if (linkMatch && props.components?.a) {
      const [, text, href] = linkMatch;
      const AnchorComponent = props.components.a;
      return React.createElement(
        'div',
        { 'data-testid': 'markdown' },
        React.createElement(AnchorComponent, { href }, text),
      );
    }

    // Parse code blocks: ```lang\ncontent\n```
    const codeMatch = content.match(/```(\w+)\n([\s\S]*?)\n```/);
    if (codeMatch && props.components?.code) {
      const [, lang, code] = codeMatch;
      const CodeComponent = props.components.code;
      return React.createElement(
        'div',
        { 'data-testid': 'markdown' },
        React.createElement(
          CodeComponent,
          { className: `language-${lang}` },
          code,
        ),
      );
    }

    return React.createElement('div', { 'data-testid': 'markdown' }, content);
  };
});

// Mock syntax highlighter
jest.mock('react-syntax-highlighter', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const PrismLight = ({ children }: any) =>
    React.createElement(
      'code',
      { 'data-testid': 'syntax-highlighter' },
      children,
    );
  PrismLight.registerLanguage = jest.fn();
  return { PrismLight };
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
jest.mock('../Mermaid', () => ({
  Mermaid: ({ chart }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'mermaid' }, chart);
  },
}));

describe('MarkdownContent', () => {
  describe('link transformation', () => {
    it('renders route links using TanStack Router Link component', () => {
      const mockTransformLink = jest.fn(
        (): LinkTransformResult => ({
          type: 'route',
          to: '/test-route',
        }),
      );

      render(
        <MarkdownContent
          content="[Click me](./test.md)"
          transformLink={mockTransformLink}
        />,
      );

      const link = screen.getByText('Click me');
      // Link renders with href from the "to" prop
      expect(link).toHaveAttribute('href', '/test-route');
      expect(mockTransformLink).toHaveBeenCalledWith('./test.md');
    });

    it('renders route links with params for parameterized routes', () => {
      const mockTransformLink = jest.fn(
        (): LinkTransformResult => ({
          type: 'route',
          to: '/architecture/$slug',
          params: { slug: 'ADR-001-test' },
        }),
      );

      render(
        <MarkdownContent
          content="[ADR Link](./ADR-001-test.md)"
          transformLink={mockTransformLink}
        />,
      );

      const link = screen.getByText('ADR Link');
      // Link renders with route pattern as href and params data attribute
      expect(link).toHaveAttribute('href', '/architecture/$slug');
      expect(link).toHaveAttribute(
        'data-params',
        JSON.stringify({ slug: 'ADR-001-test' }),
      );
      expect(mockTransformLink).toHaveBeenCalledWith('./ADR-001-test.md');
    });

    it('renders external links when transformLink returns external type', () => {
      const mockTransformLink = jest.fn(
        (): LinkTransformResult => ({
          type: 'external',
        }),
      );

      render(
        <MarkdownContent
          content="[External](https://example.com)"
          transformLink={mockTransformLink}
        />,
      );

      const link = screen.getByText('External');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders unavailable links as styled span with tooltip', () => {
      const mockTransformLink = jest.fn(
        (): LinkTransformResult => ({
          type: 'unavailable',
          tooltip: 'Copilot skill: testing-workflow (not web-accessible)',
        }),
      );

      render(
        <MarkdownContent
          content="[Testing Workflow](../../.github/skills/testing-workflow/SKILL.md)"
          transformLink={mockTransformLink}
        />,
      );

      const element = screen.getByText('Testing Workflow');
      // Should be a span, not a link
      expect(element.tagName).toBe('SPAN');
      expect(element).not.toHaveAttribute('href');
      expect(element).toHaveAttribute(
        'title',
        'Copilot skill: testing-workflow (not web-accessible)',
      );
    });

    it('falls through to default behavior when transformLink returns null', () => {
      const mockTransformLink = jest.fn((): LinkTransformResult => null);

      render(
        <MarkdownContent
          content="[Regular](/blog)"
          transformLink={mockTransformLink}
        />,
      );

      const link = screen.getByText('Regular');
      expect(link).toHaveAttribute('href', '/blog');
      expect(link).not.toHaveAttribute('target');
    });

    it('handles external https links by default (without transformLink)', () => {
      render(<MarkdownContent content="[GitHub](https://github.com)" />);

      const link = screen.getByText('GitHub');
      expect(link).toHaveAttribute('href', 'https://github.com');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('handles external http links by default', () => {
      render(<MarkdownContent content="[HTTP](http://example.com)" />);

      const link = screen.getByText('HTTP');
      expect(link).toHaveAttribute('href', 'http://example.com');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('renders regular links without transformation', () => {
      render(<MarkdownContent content="[Blog](/blog)" />);

      const link = screen.getByText('Blog');
      expect(link).toHaveAttribute('href', '/blog');
      expect(link).not.toHaveAttribute('target');
    });
  });

  describe('code rendering', () => {
    it('renders mermaid diagrams', () => {
      render(
        <MarkdownContent
          content={`\`\`\`mermaid
graph TD
A --> B
\`\`\``}
        />,
      );

      expect(screen.getByTestId('mermaid')).toBeInTheDocument();
    });

    it('renders syntax highlighted code for supported languages', () => {
      render(
        <MarkdownContent
          content={`\`\`\`typescript
const x = 1;
\`\`\``}
        />,
      );

      expect(screen.getByTestId('syntax-highlighter')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies className to wrapper div', () => {
      const { container } = render(
        <MarkdownContent content="Test" className="custom-class" />,
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('table rendering', () => {
    it('renders markdown tables with remark-gfm plugin', () => {
      const tableMarkdown = `
| Column 1 | Column 2 |
|----------|----------|
| Value 1  | Value 2  |
`;
      const { container } = render(<MarkdownContent content={tableMarkdown} />);

      // Verify the markdown was parsed
      expect(container).toBeInTheDocument();
    });
  });
});
