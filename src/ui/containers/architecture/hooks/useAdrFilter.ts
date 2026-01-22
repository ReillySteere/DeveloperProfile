import { useState, useMemo, useDeferredValue, useCallback } from 'react';
import { AdrListItem, AdrStatus } from 'shared/types';

/**
 * Manages ADR filtering state and logic.
 * Uses useDeferredValue to defer filtering during rapid typing.
 * See ADR-009 for rationale on client-side search.
 */
export function useAdrFilter(adrs: AdrListItem[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdrStatus | 'All'>('All');

  const deferredQuery = useDeferredValue(searchQuery.toLowerCase());

  const filteredAdrs = useMemo(() => {
    return adrs.filter((adr) => {
      const matchesStatus =
        statusFilter === 'All' || adr.status === statusFilter;
      // Search title and full content (searchText includes stripped markdown)
      const matchesQuery =
        !deferredQuery ||
        adr.title.toLowerCase().includes(deferredQuery) ||
        adr.searchText.includes(deferredQuery);
      return matchesStatus && matchesQuery;
    });
  }, [adrs, statusFilter, deferredQuery]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('All');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredAdrs,
    clearFilters,
  };
}
