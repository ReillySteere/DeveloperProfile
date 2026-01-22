# Architecture Feature Architecture

## Overview

The Architecture feature provides a "Glass Box" experience, surfacing the project's architectural decisions, component documentation, and live dependency graphs to visitors. It demonstrates staff-level engineering qualities: written communication, trade-off analysis, documentation culture, and system visualization.

**Route:** `/architecture`

## Purpose

This feature serves dual purposes:

1. **Transparency:** Allow visitors to explore how the application is built without leaving the app.
2. **Portfolio Demonstration:** Showcase technical leadership qualities through accessible documentation and live system visualization.

## Data Flow

### 1. File System Layer

Unlike database-backed features, Architecture reads directly from the repository's `architecture/` directory:

- **ADRs:** `architecture/decisions/ADR-*.md`
- **Component Docs:** `architecture/components/*.md`
- **Dependency Data:** Generated via `depcruise` at runtime

This keeps documentation version-controlled with the source code.

### 2. Backend API (NestJS)

- **Module:** `ArchitectureModule`
- **Controller:** `ArchitectureController` (`/api/architecture`)
  - `GET /adrs`: Returns list of ADRs with metadata and `searchText` for client-side filtering.
  - `GET /adrs/:slug`: Returns full ADR content (raw markdown).
  - `GET /components`: Returns list of component documentation.
  - `GET /components/:slug`: Returns full component doc content.
  - `GET /dependencies/:scope`: Returns dependency graph JSON (scope: `server` or `ui`).
- **Service:** `ArchitectureService`
  - Reads and parses markdown files from file system.
  - Extracts metadata (title from `# ADR-XXX:` heading, status, date).
  - Strips markdown from content to generate `searchText` for full-text search.
  - Serves pre-generated dependency graphs from `public/data/`.

### 3. Frontend Data Fetching (TanStack Query)

- **Hooks:** `src/ui/containers/architecture/hooks/useArchitecture.ts`
  - `useAdrs()`: Fetches list of ADRs from `/api/architecture/adrs`.
  - `useAdr(slug)`: Fetches single ADR from `/api/architecture/adrs/:slug`.
  - `useComponentDocs()`: Fetches component doc list.
  - `useComponentDoc(slug)`: Fetches single component doc.
  - `useDependencyGraph(scope)`: Fetches dependency graph for specified scope.
- **State Management:** Uses `QueryState` for consistent loading/error/empty states.

### 4. User Interface (React)

- **Routing Strategy (TanStack Router):**
  - **List Route:** `/architecture` - Displays ADR list, component list, and dependency overview.
  - **Detail Route:** `/architecture/$slug` - Displays single ADR or component doc.
  - **Dependencies Route:** `/architecture/dependencies` - Full-page interactive dependency graph.

- **Containers:**
  - `ArchitectureContainer` (`src/ui/containers/architecture/architecture.container.tsx`): Main list view with sections for ADRs, components, and dependency graph link.
  - `AdrDetailContainer` (`src/ui/containers/architecture/adr-detail.container.tsx`): Single ADR/component view with markdown rendering.
  - `DependenciesContainer` (`src/ui/containers/architecture/dependencies.container.tsx`): Interactive dependency graph with scope toggle.

- **Key Components:**
  - `AdrCard`: Displays ADR summary with number, title, status badge, and date.
  - `ComponentCard`: Displays component doc summary.
  - `DependencyGraph`: Renders dependency data as Mermaid flowchart.
  - Reuses `BlogContent` component for markdown rendering (syntax highlighting + Mermaid support).

## Dependency Graph Visualization

### Build-Time Generation

Since dependency graphs only change when code changes, they are generated at **build time** rather than runtime. This approach:

- **Eliminates runtime shell execution** (security benefit)
- **Removes `child_process` dependency** from production bundle
- **Ensures consistent graphs** across all instances
- **Reduces server load** (no depcruise execution on each request)

### Data Pipeline

1. **Build Script:** `npm run build:dependency-graphs` generates JSON files.
2. **Output Location:** `public/data/dependency-graph-{scope}.json`
3. **API Endpoint:** Serves pre-generated static JSON files.
4. **Mermaid Conversion:** Frontend utility converts graph JSON to Mermaid flowchart syntax.
5. **Rendering:** Existing `Mermaid` component renders the flowchart as interactive SVG.

### Build Script

**File:** `scripts/generate-dependency-graphs.js`

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const scopes = [
  {
    name: 'server',
    path: 'src/server',
    config: '.dependency-cruiser.server.js',
  },
  { name: 'ui', path: 'src/ui', config: '.dependency-cruiser.ui.js' },
];

const outputDir = path.join(__dirname, '..', 'public', 'data');
fs.mkdirSync(outputDir, { recursive: true });

for (const scope of scopes) {
  const cmd = `npx depcruise ${scope.path} --config ${scope.config} --output-type json`;
  const raw = JSON.parse(execSync(cmd, { encoding: 'utf-8' }));
  const transformed = transformDepcruiseOutput(raw, scope.name);
  fs.writeFileSync(
    path.join(outputDir, `dependency-graph-${scope.name}.json`),
    JSON.stringify(transformed, null, 2),
  );
  console.log(`Generated: dependency-graph-${scope.name}.json`);
}
```

### npm Scripts

```json
{
  "scripts": {
    "build:dependency-graphs": "node scripts/generate-dependency-graphs.js",
    "build": "npm run build:dependency-graphs && npm run build:server && npm run build:ui"
  }
}
```

### Graph Structure

```
flowchart LR
  subgraph modules["src/server/modules"]
    blog_module["blog.module"]
    blog_service["blog.service"]
  end
  subgraph shared["src/server/shared"]
    auth_adapter["auth.adapter"]
  end
  blog_module --> blog_service
  blog_controller --> auth_adapter
```

### Scope Options

- **Server:** `src/server` dependencies only.
- **UI:** `src/ui` dependencies only.

## Key Dependencies

- **Backend:**
  - `fs/promises`: File system access for reading markdown and pre-generated graph JSON.
  - No `child_process` needed at runtime (graphs generated at build time).
  - No additional database dependencies required.
- **Build Time:**
  - `dependency-cruiser`: Generates dependency graphs during build.
- **Frontend:**
  - Reuses existing: `react-markdown`, `react-syntax-highlighter`, `mermaid`.
  - No new visualization libraries needed.

## Testing Strategy

- **Backend Unit Tests:** `architecture.service.spec.ts`
  - Uses manual DI pattern (instantiate service directly).
  - Mocks `fs/promises` to avoid file system dependencies.
  - Tests ADR metadata extraction, sorting, and error handling.

- **Backend Integration Tests:** `architecture.integration.test.ts`
  - Tests against real `architecture/` directory.
  - Verifies endpoint responses match expected structure.
  - Tests 404 handling for non-existent slugs.

- **Frontend Integration Tests:** `architecture.container.test.tsx`
  - Tests at container level per project conventions.
  - Mocks axios responses (not internal hooks).
  - Verifies list rendering, navigation, and error states.
  - Mocks `mermaid` following blog test patterns.

- **E2E Tests:** `e2e/architecture.spec.ts`
  - Verifies full user flow: list → detail → back.
  - Tests dependency graph rendering and scope toggle.

## File Structure

```
src/server/modules/architecture/
├── architecture.module.ts
├── architecture.controller.ts
├── architecture.service.ts
├── architecture.service.spec.ts
├── architecture.integration.test.ts
└── tokens.ts

src/ui/containers/architecture/
├── architecture.container.tsx
├── architecture.container.test.tsx
├── adr-detail.container.tsx
├── dependencies.container.tsx
├── architecture.module.scss
├── components/
│   ├── AdrCard.tsx
│   ├── AdrCard.module.scss
│   ├── AdrFilters.tsx
│   ├── AdrFilters.module.scss
│   ├── ComponentCard.tsx
│   └── DependencyGraph.tsx
├── hooks/
│   ├── useArchitecture.ts
│   └── useAdrFilter.ts
└── utils/
    └── toMermaidGraph.ts

src/ui/shared/routes/
├── architecture.index.tsx
├── architecture.$slug.tsx
└── architecture.dependencies.tsx

src/shared/types/
└── architecture.types.ts
```

## Navigation

Added to `NavigationRail` between "Projects" and "Status":

```typescript
{ name: 'Architecture', path: '/architecture', Icon: FileText }
```

## Search & Filtering

The Architecture feature includes search and filter capabilities using client-side filtering. See [ADR-009: Client-Side Search Architecture](../decisions/ADR-009-client-side-search-architecture.md) for the decision rationale.

### Features

- **Status Filter:** Filter ADRs by status (Proposed, Accepted, Deprecated, Superseded).
- **Keyword Search:** Full-text search across ADR titles and content.
- **Debounced Input:** Search input uses `useDeferredValue` to prevent excessive re-renders.
- **URL State Sync:** Search/filter state persisted in URL query parameters for shareability.

### Data Flow

The `/api/architecture/adrs` endpoint returns `AdrListItem[]` which includes a `searchText` field containing stripped plain-text content for each ADR:

```json
[
  {
    "slug": "ADR-001-persistent-storage-for-blog",
    "title": "ADR-001: Persistent Storage for Blog",
    "status": "Accepted",
    "date": "Jan 07, 2026",
    "number": 1,
    "searchText": "persistent storage blog articles content..."
  }
]
```

The client downloads the full list once (cached with `staleTime: Infinity`), then performs all filtering locally for instant feedback.

### Why Client-Side Search?

For this use case (~10-20 ADRs, portfolio site), client-side filtering provides the best UX:

| Approach                   | Latency          | Complexity | UX                       |
| -------------------------- | ---------------- | ---------- | ------------------------ |
| Server-side per keystroke  | 50-100ms/request | Low        | Debounce needed, flicker |
| **Client-side with cache** | <10ms (memory)   | Low        | Instant feedback         |

**Trade-offs accepted:**

- Larger initial payload (~50-100KB vs ~5KB for metadata only)
- Memory usage scales with content size
- Doesn't scale to thousands of documents

See ADR-009 for full analysis.

### Frontend Implementation

**File:** `src/ui/containers/architecture/hooks/useAdrFilter.ts`

```typescript
import { useMemo, useDeferredValue } from 'react';
import { AdrListItem, AdrStatus } from 'shared/types';

interface FilterOptions {
  status: AdrStatus | 'all';
  query: string;
}

export function useAdrFilter(adrs: AdrListItem[], options: FilterOptions) {
  const deferredQuery = useDeferredValue(options.query.toLowerCase());

  return useMemo(() => {
    return adrs.filter((adr) => {
      const matchesStatus =
        options.status === 'all' || adr.status === options.status;
      const matchesQuery =
        !deferredQuery ||
        adr.title.toLowerCase().includes(deferredQuery) ||
        adr.searchText.includes(deferredQuery);
      return matchesStatus && matchesQuery;
    });
  }, [adrs, options.status, deferredQuery]);
}
```

**Component:** `src/ui/containers/architecture/components/AdrFilters.tsx`

- Status dropdown (All, Proposed, Accepted, Deprecated, Superseded)
- Search input (filtering handled by `useDeferredValue`)
- Clear filters button
- Result count display

## Future Considerations

- **Graph Interactivity:** Consider React Flow if Mermaid proves insufficient for large graphs.
- **Database Schema Visualization:** Render `database-schema.md` Mermaid diagrams inline.
