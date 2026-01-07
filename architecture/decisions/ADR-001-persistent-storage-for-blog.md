# ADR-001: Persistent Storage for Blog

## Status

Accepted - Jan 07 / 2026

## Context

The developer profile application will include a blog section for technical articles.
These articles must be creatable and updatable over time, and are expected to persist
independently of the application source code. Articles will not be deleted.

The application is not revenue generating, so cost-sensitive tooling choices are required.
However, the project explicitly values introducing architectural complexity that is
representative of real-world systems and provides opportunities for skill development
and demonstration.

At present, article content exists only as source-controlled files. This tightly couples
content updates to code changes and deploys, and limits future extensibility.

### Assumptions

- There is a single author.
- Articles are append-only (no deletions).
- Individual articles may be large, containing long-form content and embedded markdown.
- The system does not require horizontal scalability.
- Persistence infrastructure must be viable at low or no additional cost.

## Decision

We will introduce a persistence layer to store technical articles outside of the
application source code.

Article content will be treated as application data rather than as part of the
codebase. The application will be responsible for creating, reading, and updating
article records via a dedicated data access boundary.

The specific storage technology and access methodology are explicitly out of scope
for this decision and will be addressed in a subsequent ADR if needed.

## Consequences

### Positive

- Decouples content management from application deployments.
- Establishes a clear boundary between domain logic and data storage.
- Enables future enhancements such as richer editing workflows, previews,
  metadata, and reuse by other applications.
- Reflects a common real-world architectural concern suitable for demonstration
  and discussion.
- Writing articles is possible in an environment free from code distractions

### Negative

- Introduces additional architectural layers that may feel redundant given the
  application’s low complexity.
- Requires additional application surface area (data access, validation,
  and authentication).
- Creates a need for operational considerations such as data backup and migration.

## Alternatives Considered

### Maintain Articles in the Source Repository

**Pros**

- Minimal architectural overhead.
- No additional operational or UI requirements.
- Straightforward for a single-author, single-maintainer workflow.

**Cons**

- Couples content changes to code changes and deployments.
- Blurs the boundary between application logic and content.
- Limits opportunities for future evolution and architectural demonstration.

## Related ADRs

None
