# ADR-022: Case Study Content Architecture

## Status

Accepted - February 2, 2026

## Context

The portfolio needed a way to transform existing project summaries into rich, narrative
case studies that showcase the Problem → Solution → Outcome journey. This content type
requires:

1. **Structured narrative**: Multiple sections with distinct purposes
2. **Rich content**: Markdown, metrics, phases, code comparisons, diagrams
3. **Project relationship**: Case studies should link back to their source projects
4. **Admin authoring**: Content creation through authenticated API

### Goals

1. **Storytelling**: Enable detailed project narratives beyond bullet points
2. **Visual metrics**: Before/after comparisons with impact measurements
3. **Code evolution**: Show technical transformations with syntax highlighting
4. **Architecture diagrams**: Mermaid support for visual explanations
5. **Consistent patterns**: Follow established blog/project module patterns

## Decision

Create a separate `CaseStudy` entity that references `Project` via foreign key, following
the established blog module patterns.

### 1. Entity Design

```typescript
@Entity({ name: 'case_studies' })
export class CaseStudy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project, { eager: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  // Problem Section
  @Column('text')
  problemContext: string; // Markdown

  @Column('simple-json')
  challenges: string[];

  // Solution Section
  @Column('text')
  approach: string; // Markdown

  @Column('simple-json')
  phases: CaseStudyPhase[];

  @Column('simple-json')
  keyDecisions: string[];

  // Outcome Section
  @Column('text')
  outcomeSummary: string; // Markdown

  @Column('simple-json')
  metrics: CaseStudyMetric[];

  @Column('simple-json')
  learnings: string[];

  // Optional Rich Content
  @Column('simple-json', { nullable: true })
  diagrams?: CaseStudyDiagram[];

  @Column('simple-json', { nullable: true })
  codeComparisons?: CodeComparison[];

  @Column({ default: false })
  published: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 2. Why Separate Entity (Not Extending Project)

| Approach              | Rejected Because                                        |
| --------------------- | ------------------------------------------------------- |
| Extend Project entity | Projects are concise; case studies are rich narratives  |
| JSON field on Project | Too complex, poor queryability, schema evolution issues |
| Markdown files        | No admin UI, harder to integrate with project data      |

**Chosen approach**: Foreign key reference preserves:

- Independent lifecycle (case study can be unpublished while project remains)
- Clean separation of concerns (summary vs. detailed narrative)
- Query flexibility (eager loading of project data)

### 3. Storage Strategy

| Content Type     | Storage       | Rationale                               |
| ---------------- | ------------- | --------------------------------------- |
| Long-form text   | `text`        | Markdown with code blocks, headers      |
| Lists            | `simple-json` | String arrays for challenges, learnings |
| Structured data  | `simple-json` | Phases, metrics with typed interfaces   |
| Optional content | Nullable JSON | Diagrams and code comparisons optional  |

### 4. Frontend Architecture

Following the container component pattern (ADR-018):

```
src/ui/containers/case-studies/
├── case-studies.container.tsx        # List view orchestration
├── case-study-detail.container.tsx   # Detail view with all sections
├── case-studies.container.test.tsx   # Integration tests
├── case-studies.module.scss          # Feature styles
├── hooks/
│   └── useCaseStudies.ts             # Query/mutation hooks
└── components/
    ├── DiagramViewer.tsx             # Mermaid/image rendering
    ├── CodeComparisonViewer.tsx      # Before/after code display
    └── index.ts
```

### 5. Cross-Module Integration

The case study feature integrates with projects:

```typescript
// ProjectsPage fetches both projects and case studies
const { data: caseStudies } = useCaseStudies();
const caseStudyMap = useMemo(() =>
  new Map(caseStudies?.map(cs => [cs.projectId, cs.slug]) ?? []),
  [caseStudies]
);

// ProjectCard receives optional caseStudySlug prop
<ProjectCard
  project={project}
  caseStudySlug={caseStudyMap.get(project.id)}
/>
```

**Dependency boundary exception**: Entity files can be imported across modules
for TypeORM foreign key relationships (see `.dependency-cruiser.server.js`).

### 6. API Endpoints

| Method | Path                      | Auth | Description    |
| ------ | ------------------------- | ---- | -------------- |
| GET    | `/api/case-studies`       | No   | List published |
| GET    | `/api/case-studies/:slug` | No   | Get by slug    |
| POST   | `/api/case-studies`       | Yes  | Create         |
| PUT    | `/api/case-studies/:id`   | Yes  | Update         |
| DELETE | `/api/case-studies/:id`   | Yes  | Delete         |

### 7. Nested DTO Validation

Complex nested structures use class-validator with nested types:

```typescript
class CaseStudyPhaseDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  duration?: string;
}

export class CreateCaseStudyDto {
  @ValidateNested({ each: true })
  @Type(() => CaseStudyPhaseDto)
  phases: CaseStudyPhaseDto[];
  // ...
}
```

## Consequences

### Positive

- **Rich narratives**: Full Problem → Solution → Outcome storytelling
- **Visual impact**: Metrics, diagrams, and code comparisons
- **Pattern consistency**: Follows established blog module architecture
- **Cross-linking**: Bidirectional navigation between projects and case studies
- **Type safety**: Full TypeScript coverage with shared types

### Negative

- **Content creation effort**: Case studies require significant writing
- **Entity coupling**: Cross-module entity import for foreign key
- **Storage size**: JSON columns can grow large with diagrams/code

### Trade-offs Accepted

| Trade-off                    | Rationale                                    |
| ---------------------------- | -------------------------------------------- |
| JSON vs relational phases    | Simpler queries, no join overhead            |
| Eager project loading        | Always needed, avoids N+1 queries            |
| Entity import across modules | TypeORM relationship pattern, clearly scoped |

## Related Documentation

- [ADR-002: SQLite TypeORM for Persistence](ADR-002-SQLite-TypeOrm-for-persistence.md)
- [ADR-018: Container Component Pattern](ADR-018-container-component-pattern.md)
- [Implementation Plan](../plans/PLAN-1.1-interactive-case-study-system.md)
