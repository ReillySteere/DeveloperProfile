# ADR-009: Client-Side Search with Full Data Download

## Status

Accepted - January 18, 2026

Supersedes: ADR-008 (Build-Time Search Index)

## Context

The Architecture feature requires full-text search across ADR content so users can find ADRs containing specific terms. We need to decide how to implement this search capability.

### Requirements

1. **Full-text search**: Users can search ADR content, not just titles
2. **Fast perceived performance**: Search should feel instantaneous (<100ms)
3. **Simple implementation**: Avoid search infrastructure complexity
4. **Lookups by content**: When viewing ADR lists, users can filter by searching content

### Scale Considerations

This is a portfolio site with:

- ~10-20 ADRs (projected max: ~50)
- Each ADR is 2-5KB of markdown
- Total payload: ~50-100KB with search text included
- Single user at a time (not a multi-tenant SaaS)

## Decision

**Include `searchText` in the backend API response and perform filtering client-side.**

The `/api/architecture/adrs` endpoint returns `AdrListItem[]` which includes a `searchText` field containing stripped plain-text content for each ADR. The client downloads the full list once, caches it for the session, and performs all filtering locally.

### API Response Structure

```typescript
// GET /api/architecture/adrs
[
  {
    slug: 'ADR-001-persistent-storage-for-blog',
    title: 'ADR-001: Persistent Storage for Blog',
    status: 'Accepted',
    date: 'Jan 07, 2026',
    number: 1,
    searchText:
      'persistent storage blog articles markdown content database sqlite...',
  },
];
```

### Client-Side Filtering

```typescript
export function useAdrFilter(adrs: AdrListItem[], options: FilterOptions) {
  const deferredQuery = useDeferredValue(options.query.toLowerCase());

  return useMemo(() => {
    return adrs.filter((adr) => {
      const matchesStatus =
        options.status === 'all' || adr.status === options.status;
      const matchesQuery =
        !deferredQuery ||
        adr.searchText.includes(deferredQuery) ||
        adr.title.toLowerCase().includes(deferredQuery);
      return matchesStatus && matchesQuery;
    });
  }, [adrs, options.status, deferredQuery]);
}
```

## Rationale

### Why not server-side search?

| Approach                         | Complexity | Latency               | UX                               |
| -------------------------------- | ---------- | --------------------- | -------------------------------- |
| Server-side per keystroke        | Low        | ~50-100ms per request | Debounce needed, network flicker |
| Server-side with Elasticsearch   | High       | ~20-50ms per request  | Over-engineered for scale        |
| **Client-side with cached data** | Low        | <10ms (in-memory)     | Instant feedback                 |

For small datasets (<100KB), downloading everything and filtering locally provides the best user experience with the lowest complexity.

### Why not build-time generation?

ADR-008 proposed generating a separate `architecture-search-index.json` at build time. This approach had issues:

1. **Duplicate data sources**: List endpoint and search index could diverge
2. **Extra endpoint**: Required serving static JSON through a controller
3. **No real benefit**: Backend already reads files at runtime; stripping markdown is cheap

Including `searchText` in the existing list response eliminates these issues with no meaningful performance penalty.

### Trade-offs Accepted

1. **Larger initial payload**: ~50-100KB vs ~5KB for metadata-only list
   - _Mitigation_: gzip compression reduces to ~15-30KB
   - _Acceptable because_: Single request, cached for session

2. **Memory usage**: Full search text kept in memory
   - _Mitigation_: ~100KB is negligible on modern devices
   - _Acceptable because_: Portfolio site, not resource-constrained

3. **No search highlighting**: Client doesn't know exact match positions
   - _Acceptable because_: Users navigate to detail view to see context

4. **Doesn't scale to thousands of documents**
   - _Acceptable because_: This is explicitly a portfolio project, not a search engine

## Consequences

### Positive

- **Instant filtering**: No network round-trips during search
- **Single data source**: One endpoint for ADR lists, no sync issues
- **Simpler backend**: No caching layer or search index generation
- **Works offline**: Once loaded, filtering works without network
- **URL state sync**: Filter state persists in URL for shareability

### Negative

- **Larger initial load**: First visit downloads all search text
- **No fuzzy matching**: Exact substring match only (could add Fuse.js later if needed)

### Implementation Changes from ADR-008

- Remove `scripts/generate-architecture-index.js`
- Remove `public/data/architecture-search-index.json` from generated assets
- Backend `findAllAdrs()` returns `AdrListItem[]` with `searchText`
- Frontend uses single `useAdrFilter` hook (not separate `useAdrSearch`)
- ADR-008 marked as superseded

## References

- [ADR-008: Build-Time Search Index](ADR-008-build-time-search-index.md) (Superseded)
- TanStack Query `staleTime: Infinity` pattern for static data
- React 18 `useDeferredValue` for input debouncing
