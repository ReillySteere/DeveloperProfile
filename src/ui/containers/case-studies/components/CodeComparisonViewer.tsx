import React from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import ts from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { CodeComparison } from 'shared/types';
import styles from '../case-studies.module.scss';

// Register languages
SyntaxHighlighter.registerLanguage('typescript', ts);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('json', json);

interface CodeComparisonViewerProps {
  comparisons: CodeComparison[];
}

export function CodeComparisonViewer({
  comparisons,
}: CodeComparisonViewerProps) {
  if (comparisons.length === 0) {
    return null;
  }

  return (
    <div className={styles.codeComparisonsContainer}>
      {comparisons.map((comparison, index) => (
        <div key={index} className={styles.codeComparison}>
          <h4 className={styles.comparisonTitle}>{comparison.title}</h4>
          {comparison.description && (
            <p className={styles.comparisonDescription}>
              {comparison.description}
            </p>
          )}
          <div className={styles.codeColumns}>
            <div className={styles.codeColumn}>
              <div className={styles.codeLabel}>Before</div>
              <SyntaxHighlighter
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={oneDark as any}
                language={comparison.language}
                PreTag="div"
                customStyle={{ margin: 0, borderRadius: '0 0 4px 4px' }}
              >
                {comparison.before}
              </SyntaxHighlighter>
            </div>
            <div className={styles.codeColumn}>
              <div className={styles.codeLabel}>After</div>
              <SyntaxHighlighter
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={oneDark as any}
                language={comparison.language}
                PreTag="div"
                customStyle={{ margin: 0, borderRadius: '0 0 4px 4px' }}
              >
                {comparison.after}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
