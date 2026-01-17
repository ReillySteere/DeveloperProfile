# ADR-004: Migrate to better-sqlite3 Driver

## Status

Accepted - Jan 17, 2026

## Context

[ADR-002](./ADR-002-SQLite-TypeOrm-for-persistence.md) established SQLite with
TypeORM as the persistence layer. The original implementation used the `sqlite3`
npm package (TryGhost/node-sqlite3) as the database driver.

In January 2026, a security audit revealed that the `sqlite3` package has
unresolved high-severity vulnerabilities in its transitive dependency chain:

```
sqlite3 → node-gyp → tar (CVE: arbitrary file overwrite)
sqlite3 → node-gyp → make-fetch-happen → cacache → tar
```

These vulnerabilities cannot be patched because:

1. The `sqlite3` package is in maintenance-only mode (deprecated)
2. The vulnerable packages are deep transitive dependencies
3. Upstream maintainers have not released fixes

## Decision

We will migrate from `sqlite3` to **`better-sqlite3`** as the SQLite driver for
TypeORM.

### Implementation

**TypeORM Configuration:**

```typescript
TypeOrmModule.forRoot({
  type: 'better-sqlite3', // Changed from 'sqlite'
  database: 'data/database.sqlite',
  // ... rest unchanged
});
```

**Package Changes:**

```diff
- "sqlite3": "^5.1.7"
+ "better-sqlite3": "^11.7.0"
+ "@types/better-sqlite3": "^7.6.12"  // devDependencies
```

## Consequences

### Positive

- **Security**: Eliminates 6 high-severity vulnerabilities from the dependency
  tree (reduced from 12 total to 7 low-severity).
- **Performance**: `better-sqlite3` uses a synchronous API that is 3-5x faster
  than the callback-based `sqlite3` driver.
- **Active maintenance**: `better-sqlite3` is actively maintained by Joshua Wise,
  with regular updates and security patches.
- **Zero data migration**: Both drivers use the same SQLite file format.
- **Same TypeORM API**: No application code changes required beyond configuration.

### Negative

- **Synchronous API**: While faster, the synchronous nature could theoretically
  block the event loop for very large queries. This is not a concern for this
  application's small dataset.
- **Native bindings**: Still requires native compilation, though `better-sqlite3`
  provides better prebuilt binary support than `sqlite3`.

### Neutral

- Test files required updates to specify `type: 'better-sqlite3'` in their
  TypeORM configurations.

## Alternatives Considered

### sql.js (WASM-based SQLite)

**Pros:**

- No native bindings required
- Works in any JavaScript environment

**Cons:**

- Slower performance than native drivers
- Higher memory overhead

**Decision:** Rejected due to performance trade-offs not justified by the
benefits for this use case.

### Keep sqlite3 with npm overrides

**Pros:**

- No code changes required
- Could force `tar` to patched version

**Cons:**

- Overrides may break with future updates
- Does not address the root cause (deprecated package)
- Masks the problem rather than solving it

**Decision:** Rejected as a temporary workaround, not a solution.

## Related Decisions

- [ADR-002: SQLite with TypeORM](./ADR-002-SQLite-TypeOrm-for-persistence.md) -
  Original persistence decision (now updated to reference this ADR)
