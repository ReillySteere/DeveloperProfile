# ADR-023: TypeORM Cross-Module Entity References

## Status

Accepted - February 3, 2026

## Context

The Case Studies module (ADR-022) requires a relationship to the Projects module. In pure
Domain-Driven Design (DDD) and Hexagonal Architecture, aggregates should only reference
other aggregates by ID, not by direct object references. However, TypeORM's relationship
system provides significant developer experience benefits.

### The Tension

| Pure DDD Approach        | TypeORM Eager Loading                        |
| ------------------------ | -------------------------------------------- |
| `projectId: string` only | `@ManyToOne(() => Project, { eager: true })` |
| Requires separate query  | Automatic join on fetch                      |
| Full decoupling          | Type-safe navigation                         |
| Manual data assembly     | Single query efficiency                      |

### Specific Case

The `CaseStudy` entity needs to display project information (title, role, technologies)
in both list and detail views. Options:

1. **ID-only reference**: Requires frontend to make two API calls or backend to manually
   assemble the response
2. **TypeORM relationship**: Single query with automatic join, but creates compile-time
   dependency on Project entity

## Decision

We will **allow direct TypeORM entity references between business modules** with the
following constraints:

### 1. Allowed Pattern

```typescript
// case-study.entity.ts
import { Project } from '../projects/project.entity';

@Entity({ name: 'case_studies' })
export class CaseStudy {
  @Column()
  projectId: string; // Always maintain ID field

  @ManyToOne(() => Project, { eager: true })
  @JoinColumn({ name: 'projectId' })
  project: Project; // Convenience relationship
}
```

### 2. Constraints

1. **ID field required**: Always maintain the primitive ID field alongside the relationship
2. **No bidirectional relationships**: The referenced entity (Project) must NOT have a
   back-reference to the dependent entity (CaseStudy)
3. **Read-only usage**: Relationships are for reading; mutations go through the owning
   module's service
4. **Eager loading only for display**: Use `eager: true` only when data is needed for
   API responses
5. **No cross-module service injection**: Modules must NOT inject each other's services

### 3. What This Does NOT Allow

```typescript
// ❌ NOT ALLOWED - bidirectional relationship
@Entity()
export class Project {
  @OneToMany(() => CaseStudy, (cs) => cs.project)
  caseStudies: CaseStudy[]; // Creates tight coupling
}

// ❌ NOT ALLOWED - cross-module service injection
export class CaseStudyService {
  constructor(
    @Inject(PROJECT_TOKENS.ProjectsService)
    private projectsService: IProjectsService, // Violates module boundaries
  ) {}
}
```

## Consequences

### Positive

- **Developer experience**: Type-safe navigation, IDE autocomplete
- **Query efficiency**: Single query with join vs. multiple roundtrips
- **Reduced boilerplate**: No manual DTO assembly for related data
- **Consistent with NestJS/TypeORM ecosystem**: Standard patterns

### Negative

- **Compile-time coupling**: Entity file imports cross module boundary
- **Schema dependency**: Changes to Project entity may affect CaseStudy
- **Testing complexity**: Integration tests need both entities seeded

### Mitigations

1. **Dependency-cruiser exception**: Entity imports are allowed (already configured)
2. **Shared types**: API responses use `shared/types` interfaces, not entities directly
3. **Migration coordination**: Entity changes require cross-module review

### Dependency-Cruiser Enforcement

The following rules in `.dependency-cruiser.server.js` enforce these constraints:

```javascript
// Prevents core entities from referencing dependent entities (no bidirectional)
{
  name: 'entity-no-bidirectional',
  severity: 'error',
  from: { path: '^src/server/modules/(projects|blog|experience)/.*\\.entity\\.ts$' },
  to: { path: '^src/server/modules/(case-studies|performance)/.*\\.entity\\.ts$' },
}

// Cross-module imports (excluding entities and modules) are forbidden
{
  name: 'cross-module-entity-only',
  severity: 'error',
  from: { path: '^src/server/modules/([^/]+)', pathNot: ['\\.entity\\.ts$', '\\.module\\.ts$'] },
  to: { path: '^src/server/modules/([^/]+)', pathNot: ['^src/server/modules/$1', '\\.entity\\.ts$'] },
}

// Repositories are private to their module
{
  name: 'repository-internal-only',
  severity: 'error',
  from: { path: '^src/server/modules/([^/]+)' },
  to: { path: '^src/server/modules/([^/]+)/.*\\.repository\\.ts$', pathNot: ['^src/server/modules/$1/'] },
}
```

## Alternatives Considered

### 1. Separate Query + DTO Assembly

```typescript
async findBySlug(slug: string): Promise<CaseStudyResponse> {
  const caseStudy = await this.repo.findOne({ where: { slug } });
  const project = await this.projectAdapter.findById(caseStudy.projectId);
  return { ...caseStudy, project };
}
```

**Rejected**: More boilerplate, multiple queries, adapter complexity for read-only data.

### 2. Database View

Create a SQL view that joins the tables.

**Rejected**: TypeORM view support is limited; adds migration complexity.

### 3. Denormalization

Store project title/role directly on CaseStudy.

**Rejected**: Data duplication, sync issues, violates single source of truth.

## Related ADRs

- [ADR-005](ADR-005-hexagonal-architecture-shared-modules.md): Hexagonal Architecture
  (this ADR creates a documented exception for entity references)
- [ADR-022](ADR-022-case-study-content-architecture.md): Case Study Content Architecture
