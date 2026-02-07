# ADR-018: Container Component Pattern

## Status

Accepted - February 1, 2026

## Context

React applications require clear patterns for organizing components by responsibility.
Without guidelines, components can become bloated with mixed concerns (data fetching,
business logic, presentation), making them hard to test and maintain.

### Goals

1. **Isolation**: Features should be self-contained and independently testable
2. **Clear data flow**: Easy to understand where data comes from and how it's used
3. **AI readability**: Narrow-banded complexity for AI agent interpretation
4. **Dependency visibility**: Clear dependency graphs for architectural enforcement

## Decision

Adopt a **thin container pattern** with strict separation between data orchestration
and view components.

### 1. Container Hierarchy

```
src/ui/containers/<feature>/
├── <feature>.container.tsx       # Orchestration: hooks, state, delegation
├── <feature>.container.test.tsx  # Integration tests at this level
├── <feature>.module.scss         # Feature-scoped styles
├── components/                   # View-only components
│   ├── ComponentA.tsx            # Receives data via props
│   └── ComponentB.tsx            # No direct API access
├── hooks/                        # Feature-specific hooks
│   ├── use<Feature>.ts           # TanStack Query hooks
│   └── use<FeatureLogic>.ts      # Custom logic hooks
└── views/                        # (Optional) Composed view components
    └── <Feature>View.tsx         # Complex view compositions
```

### 2. Container Responsibilities

Containers are **thin orchestration layers**:

```typescript
// ✅ Correct: Thin container
export default function BlogContainer() {
  const { data, isLoading, isError, error, refetch } = useBlogPosts();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Frame id="blog">
      {isAuthenticated && (
        <Link to="/blog/create" className={styles.createLink}>
          Create Post
        </Link>
      )}
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        data={data}
        refetch={refetch}
      >
        {(posts) => <BlogList posts={posts} />}
      </QueryState>
    </Frame>
  );
}
```

Containers should:

- Use custom hooks for data fetching
- Use Zustand stores for global state
- Delegate rendering to QueryState or child components
- Pass data down via props (not context, except for truly global state)

Containers should **not**:

- Contain business logic beyond orchestration
- Make direct API calls (use hooks)
- Have complex JSX (delegate to components)

### 3. Component Responsibilities

Components in `components/` are **view-only**:

```typescript
// ✅ Correct: View component receives data as props
interface BlogListProps {
  posts: BlogPost[];
}

export function BlogList({ posts }: BlogListProps) {
  return (
    <ul className={styles.list}>
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </ul>
  );
}
```

Components should:

- Receive all data via props
- Handle presentation and user interactions
- Emit events via callback props
- Be reusable across containers if needed

Components should **not**:

- Use data-fetching hooks (useQuery, useMutation)
- Access global stores directly (unless truly necessary like theme)
- Make API calls

### 4. Hook Co-location

Feature hooks live in `containers/<feature>/hooks/`:

```typescript
// containers/blog/hooks/useBlog.ts
export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: fetchBlogPosts,
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => fetchBlogPost(slug),
    enabled: !!slug,
  });
}
```

**Why co-locate instead of shared hooks?**

- Features remain self-contained
- Clear ownership and maintenance responsibility
- Easier dependency graph analysis
- Promotes feature isolation

**When to use shared hooks** (`src/ui/shared/hooks/`):

- Truly cross-cutting concerns (auth, theme)
- Reused by 3+ features
- Generic utilities (useDebounce, useLocalStorage)

### 5. Frame Component

`Frame` wraps all page containers as a subscription method to TanStack Router:

```typescript
// src/ui/shared/components/Frame/Frame.tsx
interface FrameProps {
  id: string;
  children: React.ReactNode;
}

export function Frame({ id, children }: FrameProps) {
  return (
    <main id={id} className={styles.frame}>
      {children}
    </main>
  );
}
```

**Purpose**:

- Consistent page layout and spacing
- Section identification for navigation
- Potential future: route-based analytics, transitions

**Alternatives considered**: None formally. Frame was a quick, simple solution.
Future enhancements could include:

- Route-based loading states
- Page transition animations
- Scroll restoration integration

### 6. Data Flow Visualization

```
Container (orchestration)
    │
    ├─── useFeatureHook() ──────► TanStack Query ──► API
    │         │
    │         ▼
    │    { data, isLoading, isError }
    │
    ├─── useAuthStore() ──────────► Zustand Store ──► localStorage
    │         │
    │         ▼
    │    { isAuthenticated, token }
    │
    └─── Render
              │
              ├── QueryState (handles loading/error/empty)
              │       │
              │       └── children(data) ──► View Component
              │                                    │
              │                                    └── props only, no hooks
              │
              └── Conditional UI (auth-gated features)
```

### 7. Alternatives Considered

| Approach                    | Rejected Because                                 |
| --------------------------- | ------------------------------------------------ |
| Dedicated `/api` folder     | Adds complexity, hooks work well with containers |
| Loader functions (TanStack) | Rule of hooks violations, harder to implement    |
| Fat containers              | Poor testability, mixed concerns                 |
| Context for feature data    | Overkill for single-level passing                |

## Consequences

### Positive

- **Testability**: Containers testable at integration level
- **Clarity**: Clear distinction between data and view concerns
- **AI-friendly**: Narrow complexity bands, predictable patterns
- **Dependency tracking**: Easy to visualize and enforce boundaries
- **Maintainability**: Features can evolve independently

### Negative

- **Prop drilling**: Data must pass through container to components
- **Boilerplate**: Each feature needs container, hooks, components structure
- **Learning curve**: Team must understand the pattern

### Trade-offs Accepted

| Trade-off              | Rationale                                   |
| ---------------------- | ------------------------------------------- |
| More files per feature | Organization benefits outweigh file count   |
| Prop drilling          | Explicit data flow > implicit context magic |
| Hook duplication       | Feature isolation > DRY optimization        |

## Dependency-Cruiser Enforcement

The following rules in `.dependency-cruiser.ui.js` enforce the container/component pattern:

```javascript
// Feature components are private to their feature
{
  name: 'feature-components-internal-only',
  severity: 'error',
  comment: 'Feature-specific components should not be imported by other features.',
  from: { path: '^src/ui/containers/([^/]+)' },
  to: { path: '^src/ui/containers/([^/]+)/components/', pathNot: ['^src/ui/containers/$1/components/'] },
}

// Shared components must use barrel imports
{
  name: 'shared-components-use-barrel',
  severity: 'error',
  comment: 'Import shared components via barrel file (ui/shared/components).',
  from: { pathNot: ['^src/ui/shared/components/'] },
  to: { path: '^src/ui/shared/components/[^/]+/[^/]+\\.tsx?$' },
}

// Shared components cannot import from feature containers
{
  name: 'shared-components-no-feature-services',
  severity: 'error',
  from: { path: '^src/ui/shared/components/' },
  to: { path: '^src/ui/containers/.*/(hooks|services)/' },
}

// Services must be framework-agnostic (no React imports)
{
  name: 'services-no-react',
  severity: 'error',
  from: { path: '^src/ui/shared/services/' },
  to: { path: '^react$|^@tanstack/react' },
}

// Shared hooks can only use shared services
{
  name: 'shared-hooks-only-shared-services',
  severity: 'error',
  from: { path: '^src/ui/shared/hooks/' },
  to: { path: '^src/ui/containers/' },
}

// Feature services should stay local (warn to promote to shared if reuse needed)
{
  name: 'feature-services-stay-local',
  severity: 'warn',
  from: { path: '^src/ui/containers/([^/]+)' },
  to: { path: '^src/ui/containers/([^/]+)/services/', pathNot: ['^src/ui/containers/$1/services/'] },
}
```

## Related Documentation

- [ADR-017: Frontend State Management](ADR-017-frontend-state-management.md)
- [Feature Scaffold Skill](../../.github/skills/feature-scaffold/SKILL.md)
- [Architecture Nav Skill](../../.github/skills/architecture-nav/SKILL.md)
