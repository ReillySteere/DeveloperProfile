import React from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { Frame, Button } from 'ui/shared/components';
import { QueryState } from 'ui/shared/components/QueryState/QueryState';
import { useAdr } from './hooks/useArchitecture';
import { ArchitectureContent } from './components';
import styles from './architecture.module.scss';

/**
 * ADR Detail Container
 * Displays full content of a single ADR or component document.
 *
 * @see architecture/components/architecture.md
 */
export default function AdrDetailContainer() {
  const { slug } = useParams({ from: '/architecture/$slug' });
  const { data, isLoading, isError, error, refetch } = useAdr(slug);

  return (
    <Frame id="adr-detail">
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
          {(adr) => (
            <article className={styles.article}>
              <div className={styles.content}>
                <ArchitectureContent content={adr.content} />
              </div>
            </article>
          )}
        </QueryState>
      </div>
    </Frame>
  );
}
