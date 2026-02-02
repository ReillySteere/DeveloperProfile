import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import ts from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';
import markdown from 'react-syntax-highlighter/dist/cjs/languages/prism/markdown';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Mermaid } from '../Mermaid';
import styles from './MarkdownContent.module.scss';

// Register languages
SyntaxHighlighter.registerLanguage('typescript', ts);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('markdown', markdown);

/**
 * Result of a link transformation.
 * - `route`: An internal app route for SPA navigation (uses onClick handler)
 * - `external`: Opens in new tab with rel="noopener noreferrer"
 * - `null`: Use default anchor behavior
 */
export type LinkTransformResult =
  | { type: 'route'; to: string }
  | { type: 'external' }
  | null;

/**
 * Function to transform links. Return null to use default behavior.
 */
export type LinkTransformer = (href: string) => LinkTransformResult;

export interface MarkdownContentProps {
  /** The markdown content to render */
  content: string;
  /** Optional className for the wrapper div */
  className?: string;
  /**
   * Optional link transformer for custom link handling.
   * Return { type: 'route', to: '/path' } for SPA navigation.
   * Return { type: 'external' } for external links (new tab).
   * Return null for default anchor behavior.
   */
  transformLink?: LinkTransformer;
  /**
   * Navigate function for SPA routing. Required if transformLink returns routes.
   */
  onNavigate?: (to: string) => void;
}

/**
 * Shared markdown rendering component with syntax highlighting and Mermaid support.
 *
 * Features:
 * - GitHub Flavored Markdown (tables, strikethrough, task lists)
 * - Code syntax highlighting (TypeScript, Bash, JSON, Markdown)
 * - Mermaid diagram rendering
 * - Customizable link transformation via props
 * - External links open in new tab by default (http/https)
 */
export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  className,
  transformLink,
  onNavigate,
}) => {
  const combinedClassName = className
    ? `${styles.markdownContent} ${className}`
    : styles.markdownContent;

  return (
    <div className={combinedClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...props }) {
            if (!href) {
              return <a {...props}>{children}</a>;
            }

            // Check custom link transformer first
            if (transformLink) {
              const result = transformLink(href);
              if (result?.type === 'route' && onNavigate) {
                return (
                  <a
                    href={result.to}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(result.to);
                    }}
                    {...props}
                  >
                    {children}
                  </a>
                );
              }
              if (result?.type === 'external') {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  >
                    {children}
                  </a>
                );
              }
            }

            // Default: external links open in new tab
            if (href.startsWith('http://') || href.startsWith('https://')) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                >
                  {children}
                </a>
              );
            }

            // Default: regular link
            return (
              <a href={href} {...props}>
                {children}
              </a>
            );
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            if (language === 'mermaid') {
              return <Mermaid chart={String(children).replace(/\n$/, '')} />;
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { ref, node, ...rest } = props;

            return match ? (
              <SyntaxHighlighter
                // Resolving type conflicts caused by importing from dist folder
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={oneDark as any}
                language={language}
                PreTag="div"
                {...rest}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
