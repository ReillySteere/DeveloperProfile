---
name: code-review
description: Review code changes for quality, security, performance, and adherence to project patterns.
---

# Code Review

Use this skill when reviewing code changes, whether your own or proposed by others.

## 1. Pre-Review Checklist

Before diving into the code, verify:

- [ ] All tests pass (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] No type errors (`npm run type-check`)
- [ ] Dependency rules respected (`npm run depcruise:verify`)

## 2. Architecture Review

### Boundary Violations

Verify imports respect the Modular Monolith structure:

| Import Direction            | Allowed? |
| --------------------------- | -------- |
| `src/ui` → `src/shared`     | ✅ Yes   |
| `src/server` → `src/shared` | ✅ Yes   |
| `src/ui` → `src/server`     | ❌ No    |
| `src/server` → `src/ui`     | ❌ No    |

### Example: Catching a Boundary Violation

**Problem:**

```typescript
// src/ui/containers/blog/hooks/useBlog.ts
import { BlogPost } from 'server/modules/blog/blog.entity'; // ❌ WRONG
```

**Fix:**

```typescript
// src/ui/containers/blog/hooks/useBlog.ts
import { BlogPost } from 'shared/types/blog'; // ✅ CORRECT
```

### Feature Placement

New features should follow the vertical slice pattern:

- **Server:** `src/server/modules/<feature>/`
- **UI:** `src/ui/containers/<feature>/` or `src/ui/<feature>/`
- **Shared Types:** `src/shared/types/<feature>.ts`

## 3. SOLID Principles Check

### Single Responsibility

Each module/component should have one reason to change.

**Red Flag:** A service that handles both data fetching AND formatting.

**Example - Before:**

```typescript
class BlogService {
  async getPost(id: string) {
    /* fetch */
  }
  formatForDisplay(post: BlogPost) {
    /* format */
  } // ❌ Wrong place
}
```

**Example - After:**

```typescript
class BlogService {
  async getPost(id: string) {
    /* fetch only */
  }
}
// Formatting belongs in the UI layer
```

### Open/Closed

Code should be open for extension, closed for modification.

**Red Flag:** Adding `if` statements for new types instead of using polymorphism.

### Dependency Inversion

Depend on abstractions, not concretions.

**This project pattern:** Services use interfaces and tokens for injection.

```typescript
// ✅ GOOD - Depends on interface
constructor(@Inject(TOKENS.BlogService) private readonly service: IBlogService)

// ❌ BAD - Depends on concrete class
constructor(private readonly service: BlogService)
```

## 4. React Patterns Check

### Component Structure

| Pattern          | Expectation                                                       |
| ---------------- | ----------------------------------------------------------------- |
| State Management | Zustand for global, useState for local, TanStack Query for server |
| Props            | Destructured, typed with interface                                |
| Styling          | SCSS Modules (`*.module.scss`)                                    |
| Effects          | Minimal, justified dependencies                                   |

### Example: Reviewing a Hook

**Red Flags to Check:**

```typescript
// ❌ Manual auth header (handled by AuthInterceptor)
const { data } = useQuery({
  queryFn: () =>
    axios.get('/api/blog', {
      headers: { Authorization: `Bearer ${token}` }, // ❌ REMOVE THIS
    }),
});

// ✅ Correct - Let interceptor handle auth
const { data } = useQuery({
  queryFn: () => axios.get('/api/blog'),
});
```

### Loading/Error States

All data fetching should use `QueryState` component:

```typescript
// ✅ GOOD
<QueryState query={query} empty={<EmptyState />}>
  {(data) => <DataDisplay data={data} />}
</QueryState>

// ❌ BAD - Manual handling without consistency
{isLoading ? <Spinner /> : error ? <Error /> : <DataDisplay />}
```

## 5. NestJS Patterns Check

### Controller Review

| Requirement        | Check                                               |
| ------------------ | --------------------------------------------------- |
| Swagger decorators | `@ApiOperation`, `@ApiResponse`, `@ApiTags` present |
| Route prefix       | Starts with `/api`                                  |
| Guards             | Protected routes use `@UseGuards(JwtAuthGuard)`     |
| Validation         | DTOs use `class-validator` decorators               |

### Example: Reviewing a Controller

```typescript
// ✅ GOOD
@ApiTags('Blog')
@Controller('api/blog')
export class BlogController {
  @Get(':id')
  @ApiOperation({ summary: 'Get blog post by ID' })
  @ApiResponse({ status: 200, description: 'Post found' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  findOne(@Param('id') id: string) {
    /* ... */
  }
}

// ❌ MISSING - No Swagger decorators
@Controller('blog') // ❌ Missing /api prefix
export class BlogController {
  @Get(':id')
  findOne(@Param('id') id: string) {
    /* ... */
  }
}
```

### Service Review

| Requirement       | Check                                                     |
| ----------------- | --------------------------------------------------------- |
| Interface defined | `I<Service>Service` interface exists                      |
| Token registered  | Service registered with token in module                   |
| Error handling    | Appropriate exceptions thrown (`NotFoundException`, etc.) |

## 6. Security Review

### Critical Checks

| Area             | What to Verify                                   |
| ---------------- | ------------------------------------------------ |
| SQL Injection    | TypeORM parameterized queries used (not raw SQL) |
| Auth Bypass      | Protected endpoints have guards                  |
| Sensitive Data   | Passwords hashed, tokens not logged              |
| Input Validation | DTOs validate and sanitize input                 |

### Example: Spotting Missing Validation

**Problem:**

```typescript
@Post()
create(@Body() body: any) { // ❌ No validation
  return this.service.create(body);
}
```

**Fix:**

```typescript
@Post()
create(@Body() createDto: CreateBlogDto) { // ✅ Validated DTO
  return this.service.create(createDto);
}
```

## 7. Performance Review

### Database Queries

| Issue         | Example                      | Fix                                     |
| ------------- | ---------------------------- | --------------------------------------- |
| N+1 Query     | Loop with individual fetches | Use `relations` option or join          |
| Over-fetching | Selecting all columns        | Use `select` to limit fields            |
| Missing Index | Slow queries on large tables | Add index to frequently queried columns |

### Frontend Performance

| Issue                  | Detection                | Fix                                   |
| ---------------------- | ------------------------ | ------------------------------------- |
| Unnecessary re-renders | React DevTools Profiler  | Memoize with `useMemo`, `useCallback` |
| Large bundle           | Webpack Bundle Analyzer  | Code splitting, lazy loading          |
| Memory leaks           | Unreleased subscriptions | Cleanup in `useEffect` return         |

## 8. Testing Review

### Coverage Requirements

This project requires **100% coverage**. Verify:

- [ ] All branches covered (if/else, ternary, switch)
- [ ] Error paths tested
- [ ] Edge cases handled (empty arrays, null values)

### Test Quality

| Check                 | Expectation                               |
| --------------------- | ----------------------------------------- |
| Test isolation        | Each test independent, no shared state    |
| Meaningful assertions | Tests verify behavior, not implementation |
| Mock appropriateness  | Network mocked, internal logic not mocked |

### Example: Reviewing a Test

**Red Flag - Testing Implementation:**

```typescript
// ❌ Testing implementation detail
expect(mockService.findAll).toHaveBeenCalledTimes(1);
```

**Better - Testing Behavior:**

```typescript
// ✅ Testing user-visible behavior
expect(screen.getByText('Blog Post Title')).toBeInTheDocument();
```

## 9. Documentation Review

When code changes, check if docs need updates:

- [ ] JSDoc on public methods
- [ ] Swagger decorators on endpoints
- [ ] ADR needed for architectural decisions
- [ ] Component doc in `architecture/components/` if complex

## 10. Review Checklist Summary

```
□ Tests pass
□ Lint passes
□ Types check
□ Dependency rules pass
□ Architecture boundaries respected
□ SOLID principles followed
□ React patterns correct
□ NestJS patterns correct
□ No security issues
□ Performance acceptable
□ 100% test coverage maintained
□ Documentation updated
```
