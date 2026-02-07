/**
 * Markdown component test mocks.
 *
 * These mocks replace ESM-only dependencies (react-markdown, mermaid, remark-gfm)
 * that don't work well with Jest's module system.
 *
 * Usage:
 * These mocks are applied globally in jest-preloaded.ts. No per-test setup needed.
 *
 * For component testing that needs to verify markdown rendering behavior,
 * you can access the mock's internals:
 *
 * ```typescript
 * import { MockReactMarkdown } from 'test-utils/mockMarkdown';
 * ```
 */
import React from 'react';

interface AnchorComponentProps {
  href?: string;
  children?: React.ReactNode;
}

interface ReactMarkdownProps {
  children?: string;
  components?: {
    a?: React.ComponentType<AnchorComponentProps>;
    [key: string]: React.ComponentType<Record<string, unknown>> | undefined;
  };
  remarkPlugins?: unknown[];
  className?: string;
}

interface MermaidProps {
  chart: string;
}

/**
 * Mock ReactMarkdown component.
 * Renders children as plain text and optionally invokes custom component renderers.
 */
export const MockReactMarkdown: React.FC<ReactMarkdownProps> = ({
  children,
  components,
  className,
}) => {
  // If custom components are provided, we can invoke them for testing
  // This allows tests to verify custom link/code handlers work
  if (components?.a && children?.includes('[')) {
    // Simple detection of markdown links for testing custom anchor components
    const linkMatch = children.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const CustomAnchor = components.a;
      return (
        <div data-testid="mock-markdown" className={className}>
          <CustomAnchor href={linkMatch[2]}>{linkMatch[1]}</CustomAnchor>
        </div>
      );
    }
  }

  return (
    <div data-testid="mock-markdown" className={className}>
      {children}
    </div>
  );
};
MockReactMarkdown.displayName = 'MockReactMarkdown';

/**
 * Mock Mermaid component.
 * Renders a placeholder div with the chart definition as a data attribute.
 */
export const MockMermaid: React.FC<MermaidProps> = ({ chart }) => {
  return (
    <div data-testid="mock-mermaid" data-chart={chart}>
      [Mermaid Diagram]
    </div>
  );
};
MockMermaid.displayName = 'MockMermaid';

/**
 * Mock remark-gfm plugin.
 * Returns a no-op function since we're not actually parsing markdown.
 */
export const mockRemarkGfm = jest.fn();

/**
 * Mock mermaid library.
 */
export const mockMermaidLib = {
  initialize: jest.fn(),
  render: jest.fn().mockResolvedValue({ svg: '<svg>mocked</svg>' }),
};

/**
 * Complete react-markdown mock module.
 * Use: jest.mock('react-markdown', () => require('test-utils/mockMarkdown').mockReactMarkdownModule);
 */
export const mockReactMarkdownModule = {
  __esModule: true,
  default: MockReactMarkdown,
};

/**
 * Complete remark-gfm mock module.
 * Use: jest.mock('remark-gfm', () => require('test-utils/mockMarkdown').mockRemarkGfmModule);
 */
export const mockRemarkGfmModule = {
  __esModule: true,
  default: mockRemarkGfm,
};

/**
 * Complete mermaid mock module.
 * Use: jest.mock('mermaid', () => require('test-utils/mockMarkdown').mockMermaidModule);
 */
export const mockMermaidModule = {
  __esModule: true,
  default: mockMermaidLib,
};

/**
 * Mock SyntaxHighlighter component.
 * Renders code in a pre/code block without actual syntax highlighting.
 */
export const MockSyntaxHighlighter: React.FC<{
  children?: string;
  language?: string;
  style?: unknown;
}> = ({ children, language }) => {
  return (
    <pre data-testid="mock-syntax-highlighter" data-language={language}>
      <code>{children}</code>
    </pre>
  );
};
MockSyntaxHighlighter.displayName = 'MockSyntaxHighlighter';

// Add static registerLanguage method to match PrismLight API
interface MockSyntaxHighlighterWithStatic extends React.FC<{
  children?: string;
  language?: string;
  style?: unknown;
}> {
  registerLanguage: jest.Mock;
}
(MockSyntaxHighlighter as MockSyntaxHighlighterWithStatic).registerLanguage =
  jest.fn();

/**
 * Complete react-syntax-highlighter mock module.
 */
export const mockSyntaxHighlighterModule = {
  __esModule: true,
  PrismLight: MockSyntaxHighlighter,
  default: MockSyntaxHighlighter,
};

/**
 * Mock syntax highlighter style.
 */
export const mockOneDark = {};

/**
 * Mock react-syntax-highlighter styles module.
 */
export const mockSyntaxHighlighterStylesModule = {
  __esModule: true,
  oneDark: mockOneDark,
};

/**
 * Mock syntax highlighter language modules.
 */
export const mockLanguageModule = {
  __esModule: true,
  default: jest.fn(),
};
