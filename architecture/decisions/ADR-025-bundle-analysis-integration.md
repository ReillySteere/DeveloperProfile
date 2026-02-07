# ADR-025: Bundle Analysis Integration

## Status

Accepted - February 7, 2026

## Context

The Performance Observatory includes bundle size visualization to help track and optimize
the application's JavaScript bundle. Decisions are needed about when analysis runs, how
data is stored, and how it integrates with the CI/CD pipeline.

### Key Questions

1. **Analysis timing**: Build-time vs runtime analysis?
2. **Storage**: Where to keep historical bundle data?
3. **CI/CD integration**: Should builds fail on size budget violations?

## Decision

### 1. Build-time analysis with optional reporting

Bundle analysis runs at build time via a standalone script (`scripts/analyze-bundle.js`).
The script:

- Reads the webpack output directory
- Calculates file sizes for each chunk
- Estimates gzipped sizes
- Optionally reports results to the performance API

**Alternative considered**: Runtime analysis using webpack stats plugin. Rejected because
build-time analysis is simpler and doesn't affect application performance.

### 2. Store snapshots in the same database

Bundle snapshots are stored in the `BundleSnapshot` entity alongside performance reports.
Each snapshot captures:

- Build identifier
- Total and gzipped sizes
- Module-level breakdown

This enables historical comparison without external tooling.

### 3. Size budget checks (future)

Size budget enforcement in CI is deferred to a future iteration. The current implementation
focuses on visibility — showing developers what the bundle contains and how it compares
over time.

## Consequences

### Positive

- Simple build-time integration
- Historical comparison capability
- No runtime performance impact
- Treemap visualization aids optimization decisions

### Negative

- Gzipped sizes are estimated (not actual server-compressed sizes)
- Requires manual script execution (not yet integrated into CI)

## References

- [ADR-024: Performance Monitoring Architecture](./ADR-024-performance-monitoring-architecture.md)
- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
