import React from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import ts from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';
import markdown from 'react-syntax-highlighter/dist/cjs/languages/prism/markdown';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Mermaid } from '../../components/Mermaid';
import styles from '../../blog.module.scss';

// Register languages
SyntaxHighlighter.registerLanguage('typescript', ts);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('markdown', markdown);

interface BlogPostProps {
  content: string;
}

export const ReadBlogPost: React.FC<BlogPostProps> = ({ content }) => {
  return (
    <div className={styles.blogPost}>
      <ReactMarkdown
        components={{
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
