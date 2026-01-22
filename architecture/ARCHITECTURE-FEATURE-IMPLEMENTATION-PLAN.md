# Architecture Feature - Implementation Plan

This document provides a step-by-step implementation guide for the Architecture (ADR Explorer & Dependency Visualization) feature.

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Backend Foundation](#phase-1-backend-foundation)
3. [Phase 2: Frontend ADR Explorer](#phase-2-frontend-adr-explorer)
4. [Phase 3: Dependency Graph Backend](#phase-3-dependency-graph-backend)
5. [Phase 4: Interactive Dependency Visualization](#phase-4-interactive-dependency-visualization)
6. [Phase 5: Polish & Documentation](#phase-5-polish--documentation)
7. [Testing Strategy](#testing-strategy)
8. [File Checklist](#file-checklist)

---

## Overview

**Goal:** Create a "Glass Box" experience where visitors can explore the architectural decisions and system structure of this portfolio project.

**Key Components:**

- ADR Explorer (list/detail views for Architecture Decision Records)
- Component Documentation Browser
- Interactive Dependency Graph Visualization

**Existing Patterns to Follow:**

- Blog feature for list/detail markdown rendering
- Status feature for data visualization
- Health module for non-database endpoints

---

## Phase 1: Backend Foundation

### 1.1 Scaffold the Module

Run the scaffold script or create files manually:

```bash
node .github/skills/feature-scaffold/scaffold-feature.js architecture
```

### 1.2 Create Shared Types

**File:** `src/shared/types/architecture.types.ts`

```typescript
export type AdrStatus = 'Proposed' | 'Accepted' | 'Deprecated' | 'Superseded';

/**
 * ADR list item returned by GET /api/architecture/adrs.
 * Includes searchText for client-side full-text filtering.
 * See ADR-009 for rationale on including search content in list response.
 */
export interface AdrListItem {
  slug: string;
  title: string;
  status: AdrStatus;
  date: string;
  number: number;
  /** Stripped plain-text content for client-side search */
  searchText: string;
}

/** Full ADR with raw markdown content */
export interface Adr {
  slug: string;
  title: string;
  status: AdrStatus;
  date: string;
  number: number;
  content: string;
}

export interface ComponentDocSummary {
  slug: string;
  title: string;
}

export interface ComponentDoc extends ComponentDocSummary {
  content: string;
}

export interface DependencyEdge {
  source: string;
  target: string;
  dependencyTypes: string[];
  valid: boolean;
}

export interface DependencyNode {
  id: string;
  label: string;
  folder: string;
}

export interface DependencyGraph {
  scope: 'server' | 'ui';
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  generatedAt: string;
}

export interface ArchitectureSearchIndex {
  generatedAt: string;
  adrs: AdrSearchEntry[];
}
```

**Update:** `src/shared/types/index.ts`

```typescript
export * from './architecture.types';
```

### 1.3 Implement Architecture Service

**File:** `src/server/modules/architecture/architecture.service.ts`

````typescript
import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  Adr,
  AdrListItem,
  ComponentDoc,
  ComponentDocSummary,
} from 'shared/types';

export interface IArchitectureService {
  findAllAdrs(): Promise<AdrListItem[]>;
  findAdrBySlug(slug: string): Promise<Adr | null>;
  findAllComponents(): Promise<ComponentDocSummary[]>;
  findComponentBySlug(slug: string): Promise<ComponentDoc | null>;
}

@Injectable()
export class ArchitectureService implements IArchitectureService {
  private readonly adrPath = path.join(
    process.cwd(),
    'architecture',
    'decisions',
  );
  private readonly componentsPath = path.join(
    process.cwd(),
    'architecture',
    'components',
  );

  /**
   * Returns all ADRs with searchText for client-side filtering.
   * See ADR-009 for rationale on including full content in list response.
   */
  async findAllAdrs(): Promise<AdrListItem[]> {
    const files = await fs.readdir(this.adrPath);
    const adrs = await Promise.all(
      files
        .filter((f) => f.endsWith('.md'))
        .map(async (file) => this.parseAdrListItem(file)),
    );
    return adrs.sort((a, b) => a.number - b.number);
  }

  async findAdrBySlug(slug: string): Promise<Adr | null> {
    const files = await fs.readdir(this.adrPath);
    const file = files.find((f) => f.replace('.md', '') === slug);
    if (!file) return null;

    const content = await fs.readFile(path.join(this.adrPath, file), 'utf-8');
    const listItem = await this.parseAdrListItem(file);
    // Return full Adr with raw markdown content (not stripped searchText)
    return {
      slug: listItem.slug,
      title: listItem.title,
      status: listItem.status,
      date: listItem.date,
      number: listItem.number,
      content,
    };
  }

  private async parseAdrListItem(filename: string): Promise<AdrListItem> {
    const content = await fs.readFile(
      path.join(this.adrPath, filename),
      'utf-8',
    );
    const slug = filename.replace('.md', '');

    // Extract ADR number from filename (ADR-001-...)
    const numberMatch = filename.match(/ADR-(\d+)/);
    const number = numberMatch ? parseInt(numberMatch[1], 10) : 0;

    // Extract title from first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : slug;

    // Extract status
    const statusMatch = content.match(/##\s+Status\s*\n+([^\n]+)/i);
    const statusLine = statusMatch ? statusMatch[1] : 'Proposed';
    const status = this.parseStatus(statusLine);

    // Extract date from status line
    const dateMatch = statusLine.match(/(\w{3}\s+\d{1,2}\s*[\/,]\s*\d{4})/);
    const date = dateMatch ? dateMatch[1] : '';

    // Strip markdown for search text (see ADR-009)
    const searchText = this.stripMarkdown(content);

    return { slug, title, status, date, number, searchText };
  }

  private stripMarkdown(content: string): string {
    return content
      .replace(/```[\s\S]*?```/g, ' ') // Remove code blocks
      .replace(/`[^`]+`/g, ' ') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links → text
      .replace(/[#*_~>-]/g, ' ') // Remove markdown symbols
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toLowerCase();
  }

  private parseStatus(line: string): AdrListItem['status'] {
    if (line.toLowerCase().includes('accepted')) return 'Accepted';
    if (line.toLowerCase().includes('deprecated')) return 'Deprecated';
    if (line.toLowerCase().includes('superseded')) return 'Superseded';
    return 'Proposed';
  }

  async findAllComponents(): Promise<ComponentDocSummary[]> {
    const files = await fs.readdir(this.componentsPath);
    return files
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({
        slug: f.replace('.md', ''),
        title: this.slugToTitle(f.replace('.md', '')),
      }));
  }

  async findComponentBySlug(slug: string): Promise<ComponentDoc | null> {
    try {
      const content = await fs.readFile(
        path.join(this.componentsPath, `${slug}.md`),
        'utf-8',
      );
      return {
        slug,
        title: this.slugToTitle(slug),
        content,
      };
    } catch {
      return null;
    }
  }

  private slugToTitle(slug: string): string {
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
````

### 1.4 Implement Architecture Controller

**File:** `src/server/modules/architecture/architecture.controller.ts`

```typescript
import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IArchitectureService } from './architecture.service';
import TOKENS from './tokens';
import {
  Adr,
  AdrSummary,
  ComponentDoc,
  ComponentDocSummary,
} from 'shared/types';

@ApiTags('Architecture')
@Controller('api/architecture')
export class ArchitectureController {
  constructor(
    @Inject(TOKENS.ArchitectureService)
    private readonly architectureService: IArchitectureService,
  ) {}

  @ApiOperation({ summary: 'List all Architecture Decision Records' })
  @ApiResponse({ status: 200, description: 'List of ADRs with metadata' })
  @Get('adrs')
  async findAllAdrs(): Promise<AdrSummary[]> {
    return this.architectureService.findAllAdrs();
  }

  @ApiOperation({ summary: 'Get a single ADR by slug' })
  @ApiParam({ name: 'slug', example: 'ADR-001-persistent-storage-for-blog' })
  @ApiResponse({ status: 200, description: 'The requested ADR' })
  @ApiResponse({ status: 404, description: 'ADR not found' })
  @Get('adrs/:slug')
  async findAdrBySlug(@Param('slug') slug: string): Promise<Adr> {
    const adr = await this.architectureService.findAdrBySlug(slug);
    if (!adr) {
      throw new NotFoundException(`ADR "${slug}" not found`);
    }
    return adr;
  }

  @ApiOperation({ summary: 'List all component documentation' })
  @ApiResponse({ status: 200, description: 'List of component docs' })
  @Get('components')
  async findAllComponents(): Promise<ComponentDocSummary[]> {
    return this.architectureService.findAllComponents();
  }

  @ApiOperation({ summary: 'Get component documentation by name' })
  @ApiParam({ name: 'slug', example: 'blog' })
  @ApiResponse({ status: 200, description: 'The component documentation' })
  @ApiResponse({ status: 404, description: 'Component doc not found' })
  @Get('components/:slug')
  async findComponentBySlug(
    @Param('slug') slug: string,
  ): Promise<ComponentDoc> {
    const doc = await this.architectureService.findComponentBySlug(slug);
    if (!doc) {
      throw new NotFoundException(
        `Component documentation "${slug}" not found`,
      );
    }
    return doc;
  }
}
```

### 1.5 Create Module and Tokens

**File:** `src/server/modules/architecture/tokens.ts`

```typescript
const TOKENS = {
  ArchitectureService: Symbol('ArchitectureService'),
} as const;

export default TOKENS;
```

**File:** `src/server/modules/architecture/architecture.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ArchitectureController } from './architecture.controller';
import { ArchitectureService } from './architecture.service';
import TOKENS from './tokens';

@Module({
  controllers: [ArchitectureController],
  providers: [
    {
      provide: TOKENS.ArchitectureService,
      useClass: ArchitectureService,
    },
  ],
})
export class ArchitectureModule {}
```

### 1.6 Register Module

**Update:** `src/server/app.module.ts`

```typescript
import { ArchitectureModule } from './modules/architecture/architecture.module';

@Module({
  imports: [
    // ... existing modules
    ArchitectureModule,
  ],
})
export class AppModule {}
```

### 1.7 Unit Tests

**File:** `src/server/modules/architecture/architecture.service.spec.ts`

Follow the manual DI pattern from existing tests. Mock `fs/promises` to avoid file system dependencies.

---

## Phase 2: Frontend ADR Explorer

### 2.1 Create Route Files

**File:** `src/ui/shared/routes/architecture.index.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router';
import ArchitectureContainer from 'ui/containers/architecture/architecture.container';

export const Route = createFileRoute('/architecture/')({
  component: ArchitectureContainer,
});
```

**File:** `src/ui/shared/routes/architecture.$slug.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router';
import AdrDetailContainer from 'ui/containers/architecture/adr-detail.container';

export const Route = createFileRoute('/architecture/$slug')({
  component: AdrDetailContainer,
});
```

### 2.2 Create Data Hooks

**File:** `src/ui/containers/architecture/hooks/useArchitecture.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Adr,
  AdrListItem,
  ComponentDocSummary,
  ComponentDoc,
} from 'shared/types';

/**
 * Fetches all ADRs with searchText for client-side filtering.
 * Uses staleTime: Infinity since content is static during session.
 */
const fetchAdrs = async (): Promise<AdrListItem[]> => {
  const { data } = await axios.get<AdrListItem[]>('/api/architecture/adrs');
  return data;
};

const fetchAdr = async (slug: string): Promise<Adr> => {
  const { data } = await axios.get<Adr>(`/api/architecture/adrs/${slug}`);
  return data;
};

const fetchComponents = async (): Promise<ComponentDocSummary[]> => {
  const { data } = await axios.get<ComponentDocSummary[]>(
    '/api/architecture/components',
  );
  return data;
};

const fetchComponent = async (slug: string): Promise<ComponentDoc> => {
  const { data } = await axios.get<ComponentDoc>(
    `/api/architecture/components/${slug}`,
  );
  return data;
};

export function useAdrs() {
  return useQuery({
    queryKey: ['architecture', 'adrs'],
    queryFn: fetchAdrs,
    staleTime: Infinity, // Static content, cache for entire session
  });
}

export function useAdr(slug: string) {
  return useQuery({
    queryKey: ['architecture', 'adr', slug],
    queryFn: () => fetchAdr(slug),
    enabled: !!slug,
  });
}

export function useComponentDocs() {
  return useQuery({
    queryKey: ['architecture', 'components'],
    queryFn: fetchComponents,
  });
}

export function useComponentDoc(slug: string) {
  return useQuery({
    queryKey: ['architecture', 'component', slug],
    queryFn: () => fetchComponent(slug),
    enabled: !!slug,
  });
}
```

### 2.3 Create Container Components

**File:** `src/ui/containers/architecture/architecture.container.tsx`

```typescript
import React from 'react';
import { Link } from '@tanstack/react-router';
import { Frame } from 'ui/shared/components';
import { QueryState } from 'ui/shared/components/QueryState/QueryState';
import { useAdrs, useComponentDocs } from './hooks/useArchitecture';
import { AdrCard } from './components/AdrCard';
import { ComponentCard } from './components/ComponentCard';
import styles from './architecture.module.scss';

export default function ArchitectureContainer() {
  const adrs = useAdrs();
  const components = useComponentDocs();

  return (
    <Frame id="architecture">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Architecture</h1>
          <p className={styles.subtitle}>
            Explore the decisions, patterns, and structure behind this application.
          </p>
        </header>

        <section className={styles.section}>
          <h2>Architecture Decision Records</h2>
          <p className={styles.sectionDesc}>
            ADRs capture significant technical decisions with context, rationale, and consequences.
          </p>
          <QueryState {...adrs}>
            {(data) => (
              <div className={styles.cardGrid}>
                {data.map((adr) => (
                  <Link key={adr.slug} to="/architecture/$slug" params={{ slug: adr.slug }}>
                    <AdrCard adr={adr} />
                  </Link>
                ))}
              </div>
            )}
          </QueryState>
        </section>

        <section className={styles.section}>
          <h2>Component Documentation</h2>
          <QueryState {...components}>
            {(data) => (
              <div className={styles.cardGrid}>
                {data.map((doc) => (
                  <Link
                    key={doc.slug}
                    to="/architecture/$slug"
                    params={{ slug: `component-${doc.slug}` }}
                  >
                    <ComponentCard doc={doc} />
                  </Link>
                ))}
              </div>
            )}
          </QueryState>
        </section>

        <section className={styles.section}>
          <h2>Dependency Graph</h2>
          <p className={styles.sectionDesc}>
            Visualize the module structure and dependencies.
          </p>
          <Link to="/architecture/dependencies">
            View Interactive Dependency Graph →
          </Link>
        </section>
      </div>
    </Frame>
  );
}
```

### 2.4 Create Card Components

**File:** `src/ui/containers/architecture/components/AdrCard.tsx`

```typescript
import React from 'react';
import { Badge } from 'ui/shared/components/Badge/Badge';
import { AdrSummary } from 'shared/types';
import styles from './AdrCard.module.scss';

interface AdrCardProps {
  adr: AdrSummary;
}

const statusVariant = {
  Proposed: 'warning',
  Accepted: 'success',
  Deprecated: 'default',
  Superseded: 'default',
} as const;

export const AdrCard: React.FC<AdrCardProps> = ({ adr }) => {
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <span className={styles.number}>ADR-{adr.number.toString().padStart(3, '0')}</span>
        <Badge variant={statusVariant[adr.status]}>{adr.status}</Badge>
      </div>
      <h3 className={styles.title}>{adr.title.replace(/^ADR-\d+:\s*/, '')}</h3>
      {adr.date && <time className={styles.date}>{adr.date}</time>}
    </article>
  );
};
```

### 2.5 Update Navigation Rail

**Update:** `src/ui/shared/components/NavigationRail/NavigationRail.tsx`

Add new nav item:

```typescript
import { FileText } from 'lucide-react'; // or appropriate icon

const navItems = [
  { name: 'About', path: '/about', Icon: User },
  { name: 'Blog', path: '/blog', Icon: Book },
  { name: 'Experience', path: '/experience', Icon: Briefcase },
  { name: 'Projects', path: '/projects', Icon: Layers },
  { name: 'Architecture', path: '/architecture', Icon: FileText }, // NEW
  { name: 'Status', path: '/status', Icon: Activity },
];
```

### 2.6 Implement Search & Filter

Search and filtering use client-side filtering with the full ADR content. See [ADR-009](decisions/ADR-009-client-side-search-architecture.md) for the architectural decision.

**File:** `src/ui/containers/architecture/hooks/useAdrFilter.ts`

```typescript
import { useMemo, useDeferredValue } from 'react';
import { AdrListItem, AdrStatus } from 'shared/types';

interface FilterOptions {
  status: AdrStatus | 'all';
  query: string;
}

/**
 * Filters ADRs by status and full-text search.
 * Uses useDeferredValue to defer filtering during rapid typing.
 * See ADR-009 for rationale on client-side search.
 */
export function useAdrFilter(adrs: AdrListItem[], options: FilterOptions) {
  const deferredQuery = useDeferredValue(options.query.toLowerCase());

  return useMemo(() => {
    return adrs.filter((adr) => {
      const matchesStatus =
        options.status === 'all' || adr.status === options.status;
      // Search title and full content (searchText includes stripped markdown)
      const matchesQuery =
        !deferredQuery ||
        adr.title.toLowerCase().includes(deferredQuery) ||
        adr.searchText.includes(deferredQuery);
      return matchesStatus && matchesQuery;
    });
  }, [adrs, options.status, deferredQuery]);
}
```

**File:** `src/ui/containers/architecture/components/AdrFilters.tsx`

```typescript
import React from 'react';
import { AdrStatus } from 'shared/types';
import styles from './AdrFilters.module.scss';

interface AdrFiltersProps {
  status: AdrStatus | 'all';
  query: string;
  resultCount: number;
  totalCount: number;
  onStatusChange: (status: AdrStatus | 'all') => void;
  onQueryChange: (query: string) => void;
  onClear: () => void;
}

const STATUS_OPTIONS: Array<AdrStatus | 'all'> = [
  'all',
  'Proposed',
  'Accepted',
  'Deprecated',
  'Superseded',
];

export const AdrFilters: React.FC<AdrFiltersProps> = ({
  status,
  query,
  resultCount,
  totalCount,
  onStatusChange,
  onQueryChange,
  onClear,
}) => {
  const hasFilters = status !== 'all' || query.length > 0;

  return (
    <div className={styles.filters}>
      <div className={styles.controls}>
        <input
          type="search"
          placeholder="Search ADRs..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className={styles.searchInput}
          aria-label="Search architecture decision records"
        />
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as AdrStatus | 'all')}
          className={styles.statusSelect}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === 'all' ? 'All Statuses' : opt}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className={styles.clearButton}
            aria-label="Clear filters"
          >
            Clear
          </button>
        )}
      </div>
      <span className={styles.resultCount}>
        Showing {resultCount} of {totalCount} ADRs
      </span>
    </div>
  );
};
```

**Update:** `src/ui/containers/architecture/architecture.container.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import { useSearchParams } from '@tanstack/react-router';
import { AdrFilters } from './components/AdrFilters';
import { useAdrFilter } from './hooks/useAdrFilter';
import { AdrStatus } from 'shared/types';

export default function ArchitectureContainer() {
  const adrs = useAdrs();
  const components = useComponentDocs();

  // URL-synced filter state for shareability
  const [searchParams, setSearchParams] = useSearchParams();
  const status = (searchParams.get('status') as AdrStatus | 'all') || 'all';
  const query = searchParams.get('q') || '';

  const filteredAdrs = useAdrFilter(adrs.data || [], { status, query });

  const handleStatusChange = useCallback((newStatus: AdrStatus | 'all') => {
    setSearchParams((prev) => {
      if (newStatus === 'all') {
        prev.delete('status');
      } else {
        prev.set('status', newStatus);
      }
      return prev;
    });
  }, [setSearchParams]);

  const handleQueryChange = useCallback((newQuery: string) => {
    setSearchParams((prev) => {
      if (!newQuery) {
        prev.delete('q');
      } else {
        prev.set('q', newQuery);
      }
      return prev;
    });
  }, [setSearchParams]);

  const handleClear = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  return (
    <Frame id="architecture">
      {/* ... header ... */}

      <section className={styles.section}>
        <h2>Architecture Decision Records</h2>
        <AdrFilters
          status={status}
          query={query}
          resultCount={filteredAdrs.length}
          totalCount={adrs.data?.length || 0}
          onStatusChange={handleStatusChange}
          onQueryChange={handleQueryChange}
          onClear={handleClear}
        />
        <QueryState {...adrs}>
          {() => (
            <div className={styles.cardGrid}>
              {filteredAdrs.map((adr) => (
                <Link key={adr.slug} to="/architecture/$slug" params={{ slug: adr.slug }}>
                  <AdrCard adr={adr} />
                </Link>
              ))}
            </div>
          )}
        </QueryState>
      </section>
      {/* ... rest ... */}
    </Frame>
  );
}
```

---

## Phase 3: Dependency Graph (Build-Time Generation)

Since dependency graphs only change when code changes, they are generated at **build time** rather than runtime. This eliminates runtime shell execution and reduces server load.

### 3.1 Create Build Script

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

function transformDepcruiseOutput(raw, scopeName) {
  const nodes = [];
  const edges = [];
  const seenNodes = new Set();

  for (const module of raw.modules || []) {
    const nodeId = module.source.replace(/[^a-zA-Z0-9]/g, '_');
    if (!seenNodes.has(nodeId)) {
      seenNodes.add(nodeId);
      const parts = module.source.split('/');
      nodes.push({
        id: nodeId,
        label: parts.pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || module.source,
        folder: parts.join('/'),
      });
    }

    for (const dep of module.dependencies || []) {
      const targetId = dep.resolved.replace(/[^a-zA-Z0-9]/g, '_');
      edges.push({
        source: nodeId,
        target: targetId,
        dependencyTypes: dep.dependencyTypes || [],
        valid: dep.valid !== false,
      });

      if (!seenNodes.has(targetId)) {
        seenNodes.add(targetId);
        const targetParts = dep.resolved.split('/');
        nodes.push({
          id: targetId,
          label:
            targetParts.pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') ||
            dep.resolved,
          folder: targetParts.join('/'),
        });
      }
    }
  }

  return {
    scope: scopeName,
    nodes,
    edges,
    generatedAt: new Date().toISOString(),
  };
}

for (const scope of scopes) {
  console.log(`Generating dependency graph for ${scope.name}...`);
  const cmd = `npx depcruise ${scope.path} --config ${scope.config} --output-type json`;
  try {
    const raw = JSON.parse(execSync(cmd, { encoding: 'utf-8' }));
    const transformed = transformDepcruiseOutput(raw, scope.name);
    fs.writeFileSync(
      path.join(outputDir, `dependency-graph-${scope.name}.json`),
      JSON.stringify(transformed, null, 2),
    );
    console.log(`  ✓ Generated: dependency-graph-${scope.name}.json`);
  } catch (error) {
    console.error(`  ✗ Failed for ${scope.name}:`, error.message);
    process.exit(1);
  }
}

console.log('\nDependency graphs generated successfully.');
```

### 3.2 Update npm Scripts

**Update:** `package.json`

```json
{
  "scripts": {
    "build:dependency-graphs": "node scripts/generate-dependency-graphs.js",
    "build": "npm run build:dependency-graphs && npm run build:server && npm run build:ui"
  }
}
```

### 3.3 Add Service Method to Read Pre-Generated Graphs

**Update:** `src/server/modules/architecture/architecture.service.ts`

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { DependencyGraph } from 'shared/types';

export interface IArchitectureService {
  // ... existing methods
  getDependencyGraph(scope: 'server' | 'ui'): Promise<DependencyGraph>;
}

@Injectable()
export class ArchitectureService implements IArchitectureService {
  private readonly graphsPath = path.join(process.cwd(), 'public', 'data');

  async getDependencyGraph(scope: 'server' | 'ui'): Promise<DependencyGraph> {
    const filePath = path.join(
      this.graphsPath,
      `dependency-graph-${scope}.json`,
    );
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as DependencyGraph;
    } catch (error) {
      throw new NotFoundException(
        `Dependency graph for scope "${scope}" not found. Run 'npm run build:dependency-graphs' to generate.`,
      );
    }
  }
}
```

### 3.4 Add Controller Endpoint

**Update:** `src/server/modules/architecture/architecture.controller.ts`

```typescript
@ApiOperation({ summary: 'Get pre-generated dependency graph' })
@ApiParam({ name: 'scope', enum: ['server', 'ui'] })
@ApiResponse({ status: 200, description: 'Dependency graph data' })
@ApiResponse({ status: 404, description: 'Graph not generated' })
@Get('dependencies/:scope')
async getDependencyGraph(
  @Param('scope') scope: 'server' | 'ui',
): Promise<DependencyGraph> {
  return this.architectureService.getDependencyGraph(scope);
}
```

### 3.5 Git Ignore Generated Files (Optional)

If you want graphs regenerated on each build rather than committed:

```gitignore
# Generated dependency graphs
public/data/dependency-graph-*.json
```

Alternatively, commit them for faster builds and version history of dependency changes.

---

## Phase 4: Interactive Dependency Visualization

### 4.1 Create Mermaid Transformation Utility

**File:** `src/ui/containers/architecture/utils/toMermaidGraph.ts`

```typescript
import { DependencyGraph } from 'shared/types';

export function toMermaidFlowchart(graph: DependencyGraph): string {
  const lines = ['flowchart LR'];

  // Group nodes by folder for subgraphs
  const folderGroups = new Map<string, string[]>();
  for (const node of graph.nodes) {
    const folder = node.folder || 'root';
    if (!folderGroups.has(folder)) {
      folderGroups.set(folder, []);
    }
    folderGroups.get(folder)!.push(node.id);
  }

  // Create subgraphs
  for (const [folder, nodeIds] of folderGroups) {
    const cleanFolder = folder.replace(/[^a-zA-Z0-9]/g, '_') || 'root';
    lines.push(`  subgraph ${cleanFolder}["${folder}"]`);
    for (const nodeId of nodeIds) {
      const node = graph.nodes.find((n) => n.id === nodeId);
      lines.push(`    ${nodeId}["${node?.label || nodeId}"]`);
    }
    lines.push('  end');
  }

  // Add edges (limit to prevent overwhelming diagrams)
  const maxEdges = 100;
  const limitedEdges = graph.edges.slice(0, maxEdges);
  for (const edge of limitedEdges) {
    const style = edge.valid ? '-->' : '-.->'; // dashed for invalid
    lines.push(`  ${edge.source} ${style} ${edge.target}`);
  }

  if (graph.edges.length > maxEdges) {
    lines.push(
      `  %% ${graph.edges.length - maxEdges} additional edges omitted`,
    );
  }

  return lines.join('\n');
}
```

### 4.2 Create Dependency Graph Component

**File:** `src/ui/containers/architecture/components/DependencyGraph.tsx`

```typescript
import React, { useMemo } from 'react';
import { Mermaid } from 'ui/containers/blog/components/Mermaid';
import { DependencyGraph as DependencyGraphType } from 'shared/types';
import { toMermaidFlowchart } from '../utils/toMermaidGraph';
import styles from './DependencyGraph.module.scss';

interface DependencyGraphProps {
  graph: DependencyGraphType;
}

export const DependencyGraphView: React.FC<DependencyGraphProps> = ({ graph }) => {
  const mermaidChart = useMemo(() => toMermaidFlowchart(graph), [graph]);

  return (
    <div className={styles.container}>
      <div className={styles.stats}>
        <span>{graph.nodes.length} modules</span>
        <span>{graph.edges.length} dependencies</span>
        <span>Generated: {new Date(graph.generatedAt).toLocaleString()}</span>
      </div>
      <div className={styles.graphContainer}>
        <Mermaid chart={mermaidChart} />
      </div>
    </div>
  );
};
```

### 4.3 Create Dependencies Route

**File:** `src/ui/shared/routes/architecture.dependencies.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router';
import DependenciesContainer from 'ui/containers/architecture/dependencies.container';

export const Route = createFileRoute('/architecture/dependencies')({
  component: DependenciesContainer,
});
```

### 4.4 Create Dependencies Container

**File:** `src/ui/containers/architecture/dependencies.container.tsx`

```typescript
import React, { useState } from 'react';
import { Frame } from 'ui/shared/components';
import { QueryState } from 'ui/shared/components/QueryState/QueryState';
import { useDependencyGraph } from './hooks/useArchitecture';
import { DependencyGraphView } from './components/DependencyGraph';
import { Button } from 'ui/shared/components/Button/Button';
import styles from './architecture.module.scss';

type Scope = 'server' | 'ui';

export default function DependenciesContainer() {
  const [scope, setScope] = useState<Scope>('server');
  const query = useDependencyGraph(scope);

  return (
    <Frame id="dependencies">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Dependency Graph</h1>
          <p className={styles.subtitle}>
            Module dependency visualization generated at build time from the codebase.
          </p>
        </header>

        <div className={styles.scopeToggle}>
          {(['server', 'ui'] as Scope[]).map((s) => (
            <Button
              key={s}
              variant={scope === s ? 'primary' : 'secondary'}
              onClick={() => setScope(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>

        <QueryState {...query}>
          {(graph) => <DependencyGraphView graph={graph} />}
        </QueryState>
      </div>
    </Frame>
  );
}
```

---

## Phase 5: Polish & Documentation

### 5.1 Component Documentation

**File:** `architecture/components/architecture.md`

Document the feature following the pattern of existing component docs.

### 5.2 Documentation Audit

After the feature is finalized, perform a complete documentation review:

#### README Updates

- [ ] Update `README.md` to reference all ADRs in the `architecture/decisions/` directory
- [ ] Add Architecture feature to the feature list in README
- [ ] Update any architecture diagrams or descriptions

#### Copilot Instructions Audit

Review and update all AI assistant configuration files to reflect the new feature:

- [ ] `.github/copilot-instructions.md` - Add Architecture module to Backend Patterns section
- [ ] `.github/skills/feature-scaffold/SKILL.md` - Verify scaffold patterns still apply
- [ ] `.github/skills/architecture-nav/SKILL.md` - Update with Architecture feature routes
- [ ] `.github/skills/routing/SKILL.md` - Add Architecture routes documentation
- [ ] `.github/skills/testing-workflow/SKILL.md` - Update if new test patterns introduced
- [ ] Review all other skills for alignment with new codebase structure

#### ADR Index

Ensure all ADRs are properly referenced:

- [ ] ADR-001 through ADR-007 (existing)
- [ ] ADR-008 (superseded by ADR-009)
- [ ] ADR-009: Client-Side Search Architecture

#### Component Documentation

- [ ] `architecture/components/architecture.md` - Finalize after implementation
- [ ] Review other component docs for any cross-references needed

### 5.3 E2E Tests

**File:** `e2e/architecture.spec.ts`

E2E tests should cover the complete user journey through the Architecture feature:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Architecture Feature', () => {
  test.describe('ADR Explorer', () => {
    test('displays list of ADRs', async ({ page }) => {
      await page.goto('/architecture');
      await expect(
        page.getByRole('heading', { name: 'Architecture' }),
      ).toBeVisible();
      await expect(page.getByText('ADR-001')).toBeVisible();
    });

    test('navigates to ADR detail and back', async ({ page }) => {
      await page.goto('/architecture');
      await page.click('text=Persistent Storage');
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'Persistent Storage',
      );
      // Navigate back
      await page.goBack();
      await expect(page.getByText('ADR-001')).toBeVisible();
    });

    test('renders markdown with syntax highlighting', async ({ page }) => {
      await page.goto('/architecture/ADR-001-persistent-storage-for-blog');
      // Verify code blocks are highlighted
      await expect(page.locator('pre code')).toBeVisible();
    });
  });

  test.describe('Search & Filter', () => {
    test('filters ADRs by status', async ({ page }) => {
      await page.goto('/architecture');
      await page.selectOption('[aria-label="Filter by status"]', 'Accepted');
      // Verify URL updated
      await expect(page).toHaveURL(/status=Accepted/);
      // Verify filter applied (all visible ADRs should be Accepted)
      await expect(page.getByText('Proposed')).not.toBeVisible();
    });

    test('searches ADRs by content', async ({ page }) => {
      await page.goto('/architecture');
      await page.fill(
        '[aria-label="Search architecture decision records"]',
        'SQLite',
      );
      // Should find ADR about SQLite
      await expect(page.getByText('SQLite')).toBeVisible();
    });

    test('persists filter state in URL for shareability', async ({ page }) => {
      // Navigate directly to filtered view
      await page.goto('/architecture?status=Accepted&q=storage');
      // Verify filters are applied
      await expect(page.locator('[aria-label="Filter by status"]')).toHaveValue(
        'Accepted',
      );
      await expect(
        page.locator('[aria-label="Search architecture decision records"]'),
      ).toHaveValue('storage');
    });

    test('clears filters', async ({ page }) => {
      await page.goto('/architecture?status=Accepted&q=test');
      await page.click('[aria-label="Clear filters"]');
      await expect(page).toHaveURL('/architecture');
    });
  });

  test.describe('Dependency Graph', () => {
    test('shows dependency graph with scope toggle', async ({ page }) => {
      await page.goto('/architecture/dependencies');
      await expect(
        page.getByRole('heading', { name: 'Dependency Graph' }),
      ).toBeVisible();
      // Verify Mermaid diagram rendered
      await expect(page.locator('svg.mermaid')).toBeVisible();
    });

    test('toggles between server and UI scope', async ({ page }) => {
      await page.goto('/architecture/dependencies');
      // Default to server scope
      await expect(page.getByText('src/server')).toBeVisible();
      // Toggle to UI
      await page.click('button:has-text("UI")');
      await expect(page.getByText('src/ui')).toBeVisible();
    });
  });

  test.describe('Component Documentation', () => {
    test('displays component doc list', async ({ page }) => {
      await page.goto('/architecture');
      await expect(page.getByText('Component Documentation')).toBeVisible();
    });

    test('navigates to component doc detail', async ({ page }) => {
      await page.goto('/architecture');
      await page.click('text=Blog');
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'Blog',
      );
    });
  });

  test.describe('Navigation', () => {
    test('Architecture link appears in navigation rail', async ({ page }) => {
      await page.goto('/');
      await expect(
        page.getByRole('link', { name: 'Architecture' }),
      ).toBeVisible();
    });

    test('navigates from nav rail to architecture', async ({ page }) => {
      await page.goto('/about');
      await page.click('a[href="/architecture"]');
      await expect(page).toHaveURL('/architecture');
    });
  });
});
```

#### E2E Test Coverage Requirements

The E2E tests should verify:

1. **List Views:** ADR list, component doc list render correctly
2. **Detail Views:** ADR content renders with markdown formatting
3. **Search/Filter:** Status filter, keyword search, URL sync, clear functionality
4. **Dependency Graph:** Renders SVG, scope toggle works
5. **Navigation:** Rail link exists, routing works
6. **Error States:** 404 for non-existent ADRs (optional but recommended)

---

## Testing Strategy

### Backend Unit Tests (Manual DI)

```typescript
describe('ArchitectureService', () => {
  let service: ArchitectureService;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    mockFs = {
      readdir: jest.fn(),
      readFile: jest.fn(),
    } as any;

    // Use manual DI - instantiate directly
    service = new ArchitectureService();
    // Override private path for testing
    (service as any).adrPath = '/test/adrs';
  });

  it('should return sorted ADR summaries', async () => {
    mockFs.readdir.mockResolvedValue(['ADR-002-test.md', 'ADR-001-first.md']);
    mockFs.readFile.mockResolvedValue(
      '# ADR-001: Title\n\n## Status\n\nAccepted',
    );

    const result = await service.findAllAdrs();

    expect(result[0].number).toBe(1);
    expect(result[1].number).toBe(2);
  });
});
```

### Backend Integration Tests

```typescript
describe('ArchitectureController (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ArchitectureModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('GET /api/architecture/adrs returns ADR list', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/architecture/adrs')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('slug');
    expect(response.body[0]).toHaveProperty('title');
  });
});
```

### Frontend Integration Tests

Follow the pattern in `src/ui/containers/blog/blog.container.test.tsx`:

```typescript
describe('ArchitectureContainer', () => {
  it('renders list of ADRs', async () => {
    // Mock axios responses
    jest.spyOn(axios, 'get').mockImplementation((url) => {
      if (url.includes('/adrs')) {
        return Promise.resolve({ data: mockAdrs });
      }
      return Promise.resolve({ data: [] });
    });

    render(<ArchitectureContainer />);

    await waitFor(() => {
      expect(screen.getByText('ADR-001')).toBeInTheDocument();
    });
  });
});
```

---

## File Checklist

### Build Scripts

- [ ] `scripts/generate-dependency-graphs.js`
- [ ] `package.json` (update build scripts)

### Backend Files

- [ ] `src/shared/types/architecture.types.ts`
- [ ] `src/shared/types/index.ts` (update)
- [ ] `src/server/modules/architecture/tokens.ts`
- [ ] `src/server/modules/architecture/architecture.service.ts`
- [ ] `src/server/modules/architecture/architecture.service.spec.ts`
- [ ] `src/server/modules/architecture/architecture.controller.ts`
- [ ] `src/server/modules/architecture/architecture.module.ts`
- [ ] `src/server/modules/architecture/architecture.integration.test.ts`
- [ ] `src/server/app.module.ts` (update)

### Frontend Files

- [ ] `src/ui/shared/routes/architecture.index.tsx`
- [ ] `src/ui/shared/routes/architecture.$slug.tsx`
- [ ] `src/ui/shared/routes/architecture.dependencies.tsx`
- [ ] `src/ui/containers/architecture/architecture.container.tsx`
- [ ] `src/ui/containers/architecture/architecture.container.test.tsx`
- [ ] `src/ui/containers/architecture/adr-detail.container.tsx`
- [ ] `src/ui/containers/architecture/dependencies.container.tsx`
- [ ] `src/ui/containers/architecture/architecture.module.scss`
- [ ] `src/ui/containers/architecture/hooks/useArchitecture.ts`
- [ ] `src/ui/containers/architecture/hooks/useAdrFilter.ts`
- [ ] `src/ui/containers/architecture/components/AdrCard.tsx`
- [ ] `src/ui/containers/architecture/components/AdrCard.module.scss`
- [ ] `src/ui/containers/architecture/components/AdrFilters.tsx`
- [ ] `src/ui/containers/architecture/components/AdrFilters.module.scss`
- [ ] `src/ui/containers/architecture/components/ComponentCard.tsx`
- [ ] `src/ui/containers/architecture/components/DependencyGraph.tsx`
- [ ] `src/ui/containers/architecture/components/DependencyGraph.module.scss`
- [ ] `src/ui/containers/architecture/utils/toMermaidGraph.ts`
- [ ] `src/ui/shared/components/NavigationRail/NavigationRail.tsx` (update)

### Generated Assets

- [ ] `public/data/dependency-graph-server.json` (generated at build)
- [ ] `public/data/dependency-graph-ui.json` (generated at build)

### Documentation

- [ ] `architecture/components/architecture.md`
- [ ] `architecture/decisions/ADR-009-client-side-search-architecture.md`

### Documentation Audit (Phase 5.2)

- [ ] `README.md` (update with ADR references and Architecture feature)
- [ ] `.github/copilot-instructions.md` (add Architecture module patterns)
- [ ] `.github/skills/architecture-nav/SKILL.md` (update with Architecture routes)
- [ ] `.github/skills/routing/SKILL.md` (add Architecture routes)
- [ ] Review all other skills for alignment

### E2E Tests

- [ ] `e2e/architecture.spec.ts`

---

## Estimated Effort

| Phase                             | Effort    | Dependencies |
| --------------------------------- | --------- | ------------ |
| Phase 1: Backend Foundation       | 4-6 hours | None         |
| Phase 2: Frontend ADR Explorer    | 6-8 hours | Phase 1      |
| Phase 3: Dependency Build Script  | 1-2 hours | None         |
| Phase 4: Dependency Visualization | 3-4 hours | Phase 2, 3   |
| Phase 5: Polish & Documentation   | 4-6 hours | Phase 1-4    |

**Total: 19-27 hours**

_Note: Phase 5 includes comprehensive documentation audit and E2E test suite._

---

## Success Criteria

### Functional Requirements

1. ✅ All ADRs accessible via `/architecture` route
2. ✅ ADR detail pages render markdown with syntax highlighting and Mermaid
3. ✅ Component documentation browsable
4. ✅ Dependency graph renders as interactive Mermaid diagram
5. ✅ Scope toggle (server/ui) works
6. ✅ Navigation rail includes Architecture link
7. ✅ Full-text search across ADR content (see [ADR-009](decisions/ADR-009-client-side-search-architecture.md))
8. ✅ Filter by ADR status
9. ✅ Filter state synced to URL for shareability
10. ✅ Dependency graphs generated at build time (no runtime shell execution)
11. ✅ Client-side search filtering with single API endpoint

### Testing Requirements

12. ✅ 100% test coverage maintained (unit + integration)
13. ✅ E2E tests cover: list views, detail views, search/filter, dependency graph, navigation
14. ✅ E2E tests verify URL state persistence for filters

### Documentation Requirements

15. ✅ README updated with all ADR references
16. ✅ Copilot instructions updated with Architecture module patterns
17. ✅ All skills files audited for alignment with new codebase structure
18. ✅ Architecture component documentation finalized
