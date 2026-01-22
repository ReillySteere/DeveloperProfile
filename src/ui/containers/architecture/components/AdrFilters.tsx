import React from 'react';
import type { AdrStatus } from 'shared/types';
import { Button } from 'ui/shared/components';
import styles from './AdrFilters.module.scss';

export interface AdrFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: AdrStatus | 'All';
  onStatusChange: (status: AdrStatus | 'All') => void;
  onClear: () => void;
}

const STATUS_OPTIONS: Array<AdrStatus | 'All'> = [
  'All',
  'Proposed',
  'Accepted',
  'Deprecated',
  'Superseded',
];

export const AdrFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onClear,
}: AdrFiltersProps) => {
  const hasFilters = searchQuery !== '' || statusFilter !== 'All';

  return (
    <div className={styles.filters}>
      <div className={styles.searchContainer}>
        <input
          type="search"
          placeholder="Search ADRs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
          aria-label="Search architectural decision records"
        />
      </div>

      <div className={styles.statusContainer}>
        <label htmlFor="status-filter" className={styles.label}>
          Status:
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as AdrStatus | 'All')}
          className={styles.statusSelect}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <Button
        variant="secondary"
        onClick={onClear}
        className={`${styles.clearButton} ${!hasFilters ? styles.hidden : ''}`}
        aria-hidden={!hasFilters}
      >
        Clear Filters
      </Button>
    </div>
  );
};
