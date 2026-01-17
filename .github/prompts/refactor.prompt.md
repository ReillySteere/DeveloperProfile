---
description: Guide safe refactoring operations following project patterns and incremental change principles.
---

# Refactoring Guide

You are helping refactor code in this project. Follow these patterns for safe, incremental refactoring.

## Core Principles

1. **Incremental Changes**: Make one logical change at a time, run tests between changes
2. **Preserve Behavior**: Refactoring should not change external behavior
3. **Update All Usages**: When renaming or moving, update all references
4. **Run Validation**: After each refactor, run `npm test` and `npm run type-check`

## Refactoring Patterns

### 1. Extract Component

**When**: A component is too large or has reusable parts.

**Steps:**

1. Identify the extractable JSX and its required props
2. Create new component file in appropriate location:
   - Feature-specific: `src/ui/containers/<feature>/components/<ComponentName>.tsx`
   - Reusable: `src/ui/shared/components/<ComponentName>/`
3. Define TypeScript interface for props
4. Move JSX to new component
5. Import and use in original location
6. Run tests

**Example:**

```typescript
// Before: src/ui/containers/blog/blog.container.tsx
export const BlogContainer = () => {
  return (
    <Frame>
      {/* 50 lines of card rendering logic */}
    </Frame>
  );
};

// After: Extract to src/ui/containers/blog/components/BlogCard.tsx
interface BlogCardProps {
  post: BlogPost;
  onSelect: (slug: string) => void;
}

export const BlogCard = ({ post, onSelect }: BlogCardProps) => {
  return (/* extracted JSX */);
};

// Updated container
import { BlogCard } from './components/BlogCard';

export const BlogContainer = () => {
  return (
    <Frame>
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} onSelect={handleSelect} />
      ))}
    </Frame>
  );
};
```

### 2. Extract Hook

**When**: Component has complex state logic or data fetching that could be reused.

**Steps:**

1. Identify state and effects to extract
2. Create hook file:
   - Feature-specific: `src/ui/containers/<feature>/hooks/use<Name>.ts`
   - Reusable: `src/ui/shared/hooks/use<Name>.ts`
3. Move state, effects, and handlers to hook
4. Return necessary values and functions
5. Use hook in original component
6. Run tests

**Example:**

```typescript
// Before: Logic in component
const BlogContainer = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/blog').then((res) => {
      setPosts(res.data);
      setIsLoading(false);
    });
  }, []);

  // ...
};

// After: src/ui/containers/blog/hooks/useBlogPosts.ts
export const useBlogPosts = () => {
  return useQuery({
    queryKey: ['blog', 'posts'],
    queryFn: () => axios.get<BlogPost[]>('/api/blog').then((res) => res.data),
  });
};

// Updated container
import { useBlogPosts } from './hooks/useBlogPosts';

const BlogContainer = () => {
  const { data: posts, isLoading, isError, error } = useBlogPosts();
  // ...
};
```

### 3. Move to Shared

**When**: A type, utility, or component is used by multiple features.

**Types → `src/shared/types/`**

```bash
# Check for usages first
grep -r "BlogPost" src/

# Move type definition
# From: src/ui/containers/blog/types.ts
# To: src/shared/types/blog.ts

# Update all imports
```

**Components → `src/ui/shared/components/`**

1. Create folder: `src/ui/shared/components/<ComponentName>/`
2. Move component and styles
3. Add to barrel export: `src/ui/shared/components/index.ts`
4. Update `architecture/components/shared-ui.md`
5. Update all imports to use barrel: `import { X } from 'ui/shared/components'`

**Utilities → `src/shared/utils/` or `src/ui/shared/utils/`**

- Backend-only utils: `src/server/utils/`
- Frontend-only utils: `src/ui/shared/utils/`
- Shared utils: `src/shared/utils/`

### 4. Safe Renaming

**When**: A function, component, or file needs a better name.

**Steps:**

1. **Find all usages first:**

   ```bash
   # For a function/component name
   grep -r "OldName" src/

   # For file references
   grep -r "old-name" src/
   ```

2. **Rename in this order:**
   - Rename the definition (function/class/component)
   - Rename the file (if applicable)
   - Update all imports
   - Update all usages
   - Update tests
   - Update documentation

3. **Verify no references remain:**

   ```bash
   grep -r "OldName" src/
   npm run type-check
   npm test
   ```

### 5. Extract Service Method

**When**: A controller has business logic that should be in the service.

**Steps:**

1. Move logic from controller to service
2. Inject any needed dependencies
3. Call service from controller
4. Update tests for both

**Example:**

```typescript
// Before: Logic in controller
@Controller('api/blog')
export class BlogController {
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const post = await this.repository.findOne({ where: { slug } });
    if (!post) {
      throw new NotFoundException(`Post with slug "${slug}" not found`);
    }
    return post;
  }
}

// After: Logic in service
// blog.service.ts
async findBySlug(slug: string): Promise<BlogPost> {
  const post = await this.repository.findOne({ where: { slug } });
  if (!post) {
    throw new NotFoundException(`Post with slug "${slug}" not found`);
  }
  return post;
}

// blog.controller.ts
@Get(':slug')
async findBySlug(@Param('slug') slug: string) {
  return this.blogService.findBySlug(slug);
}
```

## Validation Checklist

After any refactoring:

- [ ] `npm run type-check` - No type errors
- [ ] `npm test` - All tests pass
- [ ] `npm run lint` - No lint errors
- [ ] `npm run depcruise:verify` - Dependency rules pass
- [ ] Behavior unchanged (manual verification if needed)

## Common Mistakes to Avoid

1. **Breaking the barrel import pattern**: When moving to shared, always update `index.ts`
2. **Forgetting test updates**: If you move a file, its test file path should match
3. **Circular dependencies**: Check with `npm run depcruise:verify` after moving files
4. **Missing documentation**: If moving to shared, update `shared-ui.md` or add JSDoc
