import React from 'react';
import { MarkdownContent, Skeleton } from 'ui/shared/components';
import { useComponentDocs } from '../hooks/useComponentDocs';
import styles from '../playground.module.scss';

interface MDXDocPanelProps {
  componentName: string;
}

export function MDXDocPanel({ componentName }: MDXDocPanelProps) {
  const { data, isLoading, isError } = useComponentDocs(componentName);

  if (isLoading) {
    return <Skeleton height={200} aria-label="Loading documentation" />;
  }

  if (isError || !data?.content) {
    return (
      <div className={styles.noDocsMessage} data-testid="no-docs-message">
        <p>No documentation available for this component.</p>
      </div>
    );
  }

  return (
    <div className={styles.mdxDocPanel} data-testid="mdx-doc-panel">
      <MarkdownContent content={data.content} />
    </div>
  );
}
