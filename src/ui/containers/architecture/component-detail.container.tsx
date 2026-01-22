import React from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { Frame, Button } from 'ui/shared/components';
import { QueryState } from 'ui/shared/components/QueryState/QueryState';
import { useComponentDoc } from './hooks/useArchitecture';
import { ArchitectureContent } from './components';
import styles from './architecture.module.scss';

/**
 * Component Detail Container
 * Displays full content of a component documentation file.
 *
 * @see architecture/components/architecture.md
 */
export default function ComponentDetailContainer() {
  const { slug } = useParams({ from: '/architecture/components/$slug' });
  const { data, isLoading, isError, error, refetch } = useComponentDoc(slug);

  return (
    <Frame id="component-detail">
      <div className={styles.detailContainer}>
        <Link to="/architecture" className={styles.backLink}>
          <Button variant="secondary">← Back to Architecture</Button>
        </Link>

        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          data={data}
          refetch={refetch}
          isEmpty={() => false}
        >
          {(doc) => (
            <article className={styles.article}>
              <header className={styles.detailHeader}>
                <h1>{doc.name}</h1>
              </header>
              <div className={styles.content}>
                <ArchitectureContent content={doc.content} />
              </div>
            </article>
          )}
        </QueryState>
      </div>
    </Frame>
  );
}
