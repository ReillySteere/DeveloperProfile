# ADR-008: Build-Time Search Index for Architecture Documentation

## Status

**Superseded** by [ADR-009: Client-Side Search Architecture](ADR-009-client-side-search-architecture.md) - January 18, 2026

## Context

The Architecture feature includes a search capability that allows users to filter ADRs by keyword. The search needs to match against both metadata (title, status) and full document content.

### Requirements

1. **Full-text search**: Users should find ADRs containing specific terms in the body
2. **Fast response**: Search should feel instantaneous (<100ms perceived)
3. **Simple implementation**: Avoid introducing search infrastructure (Elasticsearch, etc.)
4. **Consistency**: Search results should be deterministic across requests

### Options Considered

#### Option A: Runtime File Reading with In-Memory Cache

```typescript
// Read all ADR files on first request, cache in memory
class ArchitectureService {
  private cache: AdrWithContent[] | null = null;

  async search(query: string): Promise<AdrSummary[]> {
    if (!this.cache) {
      this.cache = await this.loadAllAdrs();
    }
    return this.cache.filter((adr) =>
      adr.content.toLowerCase().includes(query.toLowerCase()),
    );
  }
}
```

**Pros:**

- Dynamic, reflects latest file changes

**Cons:**

- Stateful service (cache invalidation complexity)
- First request penalty (read all files)
- Memory usage scales with content size
- Inconsistent behavior between cold/warm states

#### Option B: Include Full Content in List API Response

```typescript
// Return everything, let client filter
GET /api/architecture/adrs → [{ title, status, content: "full markdown..." }]
```

**Pros:**

- Simplest implementation
- No server-side search logic

**Cons:**

- Large payload (~100KB+ for 20 ADRs)
- Transfers unused content on every list view
- Poor mobile/slow network experience

#### Option C: Build-Time Search Index (Selected)

```javascript
// Generate at build time: public/data/architecture-search-index.json
{
  "generatedAt": "2026-01-18T...",
  "adrs": [
    {
      "slug": "ADR-001-persistent-storage-for-blog",
      "title": "ADR-001: Persistent Storage for Blog",
      "status": "Accepted",
      "date": "Jan 07, 2026",
      "number": 1,
      "searchText": "persistent storage blog articles content..."
    }
  ]
}
```

**Pros:**

- Static file, instant serving
- Consistent with dependency graph pattern (already using build-time generation)
- No runtime state or cache invalidation
- Smaller than raw markdown (stripped formatting)
- Predictable performance

**Cons:**

- Requires rebuild to update search index
- Slight build complexity

## Decision

We will generate a **search index at build time** that includes stripped plain-text content for each ADR. This follows the same pattern established for dependency graph generation.

### Implementation

#### Build Script

**File:** `scripts/generate-architecture-index.js`

````javascript
const fs = require('fs');
const path = require('path');

const decisionsDir = path.join(__dirname, '..', 'architecture', 'decisions');
const outputPath = path.join(
  __dirname,
  '..',
  'public',
  'data',
  'architecture-search-index.json',
);

function stripMarkdown(content) {
  return content
    .replace(/```[\s\S]*?```/g, ' ') // Remove code blocks
    .replace(/`[^`]+`/g, ' ') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links → text
    .replace(/[#*_~>-]/g, ' ') // Remove markdown symbols
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .toLowerCase();
}

function parseAdr(filename, content) {
  const slug = filename.replace('.md', '');
  const numberMatch = filename.match(/ADR-(\d+)/);
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const statusMatch = content.match(/##\s+Status\s*\n+([^\n]+)/i);
  const statusLine = statusMatch ? statusMatch[1] : 'Proposed';
  const dateMatch = statusLine.match(/(\w{3}\s+\d{1,2}\s*[,\/]\s*\d{4})/);

  return {
    slug,
    title: titleMatch ? titleMatch[1] : slug,
    status: parseStatus(statusLine),
    date: dateMatch ? dateMatch[1] : '',
    number: numberMatch ? parseInt(numberMatch[1], 10) : 0,
    searchText: stripMarkdown(content),
  };
}

function parseStatus(line) {
  if (line.toLowerCase().includes('accepted')) return 'Accepted';
  if (line.toLowerCase().includes('deprecated')) return 'Deprecated';
  if (line.toLowerCase().includes('superseded')) return 'Superseded';
  return 'Proposed';
}

const files = fs.readdirSync(decisionsDir).filter((f) => f.endsWith('.md'));
const adrs = files
  .map((file) => {
    const content = fs.readFileSync(path.join(decisionsDir, file), 'utf-8');
    return parseAdr(file, content);
  })
  .sort((a, b) => a.number - b.number);

const index = {
  generatedAt: new Date().toISOString(),
  adrs,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
console.log(`✓ Generated architecture search index (${adrs.length} ADRs)`);
````

#### npm Scripts

```json
{
  "scripts": {
    "build:architecture-index": "node scripts/generate-architecture-index.js",
    "build:static-data": "npm run build:dependency-graphs && npm run build:architecture-index",
    "build": "npm run build:static-data && npm run build:server && npm run build:ui"
  }
}
```

#### API Endpoint

The backend serves the pre-generated index:

```typescript
@Get('search-index')
async getSearchIndex(): Promise<ArchitectureSearchIndex> {
  const filePath = path.join(process.cwd(), 'public', 'data', 'architecture-search-index.json');
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}
```

#### Frontend Usage

```typescript
// Fetch index once, filter client-side
export function useAdrSearch() {
  const { data: index } = useQuery({
    queryKey: ['architecture', 'search-index'],
    queryFn: () =>
      axios.get('/api/architecture/search-index').then((r) => r.data),
    staleTime: Infinity, // Static data, never refetch
  });

  return useCallback(
    (query: string, status: AdrStatus | 'all') => {
      if (!index) return [];
      const q = query.toLowerCase();
      return index.adrs.filter(
        (adr) =>
          (status === 'all' || adr.status === status) &&
          (!q ||
            adr.searchText.includes(q) ||
            adr.title.toLowerCase().includes(q)),
      );
    },
    [index],
  );
}
```

## Consequences

### Positive

- **Consistent pattern**: Aligns with existing build-time generation for dependency graphs
- **No runtime complexity**: No caching, no state, no invalidation logic
- **Optimal performance**: Static JSON served instantly, TanStack Query caches indefinitely
- **Smaller payload**: Stripped text is ~50% smaller than raw markdown
- **Testable**: Generated file can be validated in CI

### Negative

- **Build dependency**: Search index must be regenerated when ADRs change
- **Slight staleness**: In development, index may lag behind file edits (acceptable)

### Mitigations

- Include index generation in standard build pipeline
- Add validation step in CI to ensure index is current
- Development mode could fall back to runtime parsing if needed (not implemented initially)

## References

- [ADR-007: Simulated Chaos Mode](ADR-007-simulated-chaos-mode.md) - Similar pattern of avoiding runtime complexity
- [Architecture Feature Documentation](../components/architecture.md)
