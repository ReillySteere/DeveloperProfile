---
name: architecture-nav
description: Understand the Modular Monolith structure, find feature code, and resolve routes.
---

# Architecture Navigation

Use this skill when you need to locate code, understand the separation of concerns, or trace a route.

## 1. Project Structure

The project is a **Modular Monolith** with a strictly separated Frontend and Backend in a single repo.

- **Frontend**: `src/ui` (React 19, TanStack Router)
- **Backend**: `src/server` (NestJS, TypeORM, SQLite)
- **Shared**: `src/shared` (Types used by both)

## 2. Feature Mapping

Features are vertical slices split across the two main directories.

| Feature Area | UI Path | Server Path |
|Details|---|---|
| **Blog** | `src/ui/containers/blog/` | `src/server/modules/blog/` |
| **Experience** | `src/ui/containers/experience/` | `src/server/modules/experience/` |
| **Auth** | `src/ui/signin/` | `src/server/shared/modules/auth/` |

### Example: Finding Code for a Feature

**Task:** "Find where blog posts are created"

**Step 1:** Identify the feature → `blog`

**Step 2:** Check both layers:

- **UI (form/hook):** `src/ui/containers/blog/hooks/useBlog.ts` → look for `useCreateBlogPost`
- **Server (API):** `src/server/modules/blog/blog.controller.ts` → look for `@Post()` decorator
- **Server (logic):** `src/server/modules/blog/blog.service.ts` → look for `create()` method

**Step 3:** Check shared types: `src/shared/types/blog.ts`

## 3. Route Resolution

To find the code for a URL:

### Frontend Routes (TanStack Router)

Check `src/ui/routeTree.gen.ts` to see the generated tree, but look for source files in `src/ui/containers/<feature>`.

- URL `/blog` -> Likely `src/ui/containers/blog/blog.container.tsx`

#### Example: Resolving a Frontend Route

**Task:** "Find the code for `/blog/my-first-post`"

**Step 1:** Identify route pattern → `/blog/$slug` (dynamic segment)

**Step 2:** Check route files:

- Parent route: `src/ui/shared/routes/blog.tsx` or `src/ui/containers/blog/`
- Dynamic segment: Look for `$slug` in filename or route definition

**Step 3:** Find the container:

- `src/ui/containers/blog/blog-post.container.tsx` handles `/blog/$slug`
- The `$slug` param is extracted via `useParams()`

### Backend Routes (NestJS)

API routes are prefixed with `/api`.

- URL `/api/posts` -> Look for `@Controller('posts')` in `src/server/modules`.
- Global prefix is set in `main.ts`.

#### Example: Resolving a Backend Route

**Task:** "Find the handler for `GET /api/blog/my-post`"

**Step 1:** Strip the `/api` prefix → `blog/my-post`

**Step 2:** Search for the controller:

```bash
# Search for the controller decorator
grep -r "@Controller('blog')" src/server/
# or
grep -r '@Controller("blog")' src/server/
```

**Step 3:** Find the method:

```typescript
// src/server/modules/blog/blog.controller.ts
@Controller('api/blog')
export class BlogController {
  @Get(':slug') // ← This handles GET /api/blog/my-post
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }
}
```

## 4. Dependency Rules

- **Strict**: `src/ui` CANNOT import from `src/server`.
- **Strict**: `src/server` CANNOT import from `src/ui`.
- **Allowed**: Both can import from `src/shared`.

### Example: Identifying Import Violations

**Problem Code:**

```typescript
// ❌ WRONG - src/ui/containers/blog/hooks/useBlog.ts
import { BlogPost } from 'server/modules/blog/blog.entity';
```

**Why It's Wrong:** UI is importing directly from server layer.

**Correct Approach:**

```typescript
// ✅ CORRECT - src/ui/containers/blog/hooks/useBlog.ts
import { BlogPost } from 'shared/types/blog';
```

**The shared type must exist:**

```typescript
// src/shared/types/blog.ts
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  // ... other fields
}
```

## 5. Quick Reference Commands

| Task                    | Command                             |
| ----------------------- | ----------------------------------- |
| Find all controllers    | `grep -r "@Controller" src/server/` |
| Find all containers     | `ls src/ui/containers/*/`           |
| Check imports from file | `npx depcruise src/path/to/file.ts` |
| Visualize module deps   | `npm run depcruise:graph:server`    |

```

```
