import React from 'react';
import { Link } from '@tanstack/react-router';
import { Frame, Button, QueryState } from 'ui/shared/components';
import { useAdrs, useComponentDocs } from './hooks/useArchitecture';
import { useAdrFilter } from './hooks/useAdrFilter';
import { AdrCard, AdrFilters, ComponentCard } from './components';
import styles from './architecture.module.scss';

/**
 * Architecture Overview Container
 * Displays all ADRs and component documentation with search/filter.
 *
 * @see architecture/components/architecture.md
 */
export default function ArchitectureContainer() {
  const adrsQuery = useAdrs();
  const componentsQuery = useComponentDocs();

  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredAdrs,
    clearFilters,
  } = useAdrFilter(adrsQuery.data ?? []);

  return (
    <Frame id="architecture">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Architecture</h1>
          <p className={styles.subtitle}>
            Explore architectural decisions and component documentation
          </p>
          <Link to="/architecture/dependencies">
            <Button variant="secondary">View Dependency Graph</Button>
          </Link>
        </header>

        <section className={styles.section}>
          <h2>Architectural Decision Records</h2>
          <AdrFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onClear={clearFilters}
          />

          <QueryState
            isLoading={adrsQuery.isLoading}
            isError={adrsQuery.isError}
            error={adrsQuery.error}
            data={filteredAdrs}
            refetch={adrsQuery.refetch}
          >
            {(adrs) => (
              <div className={styles.cardGrid}>
                {adrs.map((adr) => (
                  <AdrCard key={adr.slug} adr={adr} />
                ))}
              </div>
            )}
          </QueryState>
        </section>

        <section className={styles.section}>
          <h2>Component Documentation</h2>
          <QueryState
            isLoading={componentsQuery.isLoading}
            isError={componentsQuery.isError}
            error={componentsQuery.error}
            data={componentsQuery.data}
            refetch={componentsQuery.refetch}
          >
            {(components) => (
              <div className={styles.cardGrid}>
                {components.map((component) => (
                  <ComponentCard key={component.slug} component={component} />
                ))}
              </div>
            )}
          </QueryState>
        </section>
      </div>
    </Frame>
  );
}
