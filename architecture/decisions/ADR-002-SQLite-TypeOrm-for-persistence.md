# ADR-002: Use SQLite with TypeORM for Article Persistence

## Status

Accepted - Jan 07, 2026

**See also:** [ADR-004](./ADR-004-better-sqlite3-driver.md) - Driver migration
from `sqlite3` to `better-sqlite3`

## Context

[ADR-001 Persistent Storage for Blog](./ADR-001-persistent-storage-for-blog.md) established the decision to introduce persistent storage for technical articles, decoupling content from the application source code.

This follow-up decision concerns the selection of a persistence technology that
meets the following primary characteristics:

- Low or zero ongoing cost
- Simple backup and restore procedures
- Viable migration path to a more robust database if required
- Appropriate for a small number of records with low write concurrency
- Suitable for a single-author application with limited operational complexity

The system is expected to store a relatively small dataset (technical articles),
with infrequent writes and primarily read-heavy access patterns.

## Decision

We will use **SQLite** as the backing database for article persistence, accessed
via **TypeORM** as the application’s data access layer.

SQLite will be used as an embedded database, with data stored in a single
persistent file. TypeORM will be used to model entities, manage schema evolution,
and provide an abstraction layer that reduces coupling to the underlying database.

## Consequences

### Positive

- **Low cost**: SQLite requires no separate database server or managed service.
- **Operational simplicity**: Backup and restore can be performed via file copy.
- **Development parity**: Local and production environments can share the same
  database model and tooling.
- **Migration flexibility**: TypeORM reduces friction when migrating to a
  client-server database (e.g., Postgres) if requirements change.
- **Appropriate fit**: Well-suited to low-concurrency, small-scale data sets.

### Negative

- **Concurrency limits**: SQLite is not suitable for high write concurrency or
  horizontally scaled deployments.
- **Hosting constraints**: Requires a deployment model with persistent disk
  storage.
- **ORM abstraction cost**: Some SQLite-specific behavior may not translate
  perfectly to other databases, requiring care during migration.
- **Additional tooling**: Schema migrations and backups must still be managed,
  even if simplified.

## Alternatives Considered

### Managed Relational Database (e.g., Postgres)

**Pros**

- Strong concurrency support and scalability.
- Production-grade reliability and tooling.

**Cons**

- Ongoing hosting cost.
- Operational complexity disproportionate to system needs.
- Over-engineered for the expected data volume and access patterns.

### File-Based Persistence (Markdown / JSON)

**Pros**

- Extremely simple and transparent storage.
- Easy to version control.

**Cons**

- Weak query capabilities.
- Poor fit for future enhancements (metadata, indexing, reuse).
- Blurs boundary between content and application data.

### SQLite Without an ORM

**Pros**

- Maximum control over queries and schema.
- Minimal abstraction.

**Cons**

- Requires stronger SQL familiarity.
- Increases coupling between application code and storage.
- Higher migration cost if the database changes later.

## Related Decisions

- [ADR-001: Persistent Storage for Blog](./ADR-001-persistent-storage-for-blog.md)
