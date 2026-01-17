---
name: routing
description: Guide for TanStack Router file-based routing, navigation, and route parameters.
---

# Routing

Use this skill when adding routes, handling navigation, or working with URL parameters.

## 1. File-Based Routing

### Route File Locations

This project uses TanStack Router with file-based routing:

```
src/ui/shared/routes/
├── __root.tsx          # Root layout (always renders)
├── index.tsx           # Home route (/)
├── about.tsx           # /about
├── experience.tsx      # /experience
├── projects.tsx        # /projects
├── blog.index.tsx      # /blog (list view)
├── blog.$slug.tsx      # /blog/:slug (post detail)
└── blog.create.tsx     # /blog/create (new post)
```

### Route Generation

Routes are auto-generated into `src/ui/routeTree.gen.ts`.

**⚠️ CRITICAL: Never edit `routeTree.gen.ts` directly!**

It regenerates automatically when you:

- Add/remove/rename route files
- Run `npm start` (watch mode)
- Run `npx tsr generate`

### Route File Structure

```typescript
// src/ui/shared/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router';
import { AboutContainer } from 'ui/containers/about/about.container';

export const Route = createFileRoute('/about')({
  component: AboutContainer,
});
```

## 2. Route Patterns

### Static Routes

Simple, no parameters:

```typescript
// src/ui/shared/routes/about.tsx
export const Route = createFileRoute('/about')({
  component: AboutContainer,
});
// Matches: /about
```

### Dynamic Routes (Parameters)

Use `$` prefix for path parameters:

```typescript
// src/ui/shared/routes/blog.$slug.tsx
import { createFileRoute } from '@tanstack/react-router';
import { BlogPostContainer } from 'ui/containers/blog/blog-post.container';

export const Route = createFileRoute('/blog/$slug')({
  component: BlogPostContainer,
});
// Matches: /blog/my-first-post, /blog/another-article
```

**Accessing Parameters:**

```typescript
import { useParams } from '@tanstack/react-router';

function BlogPostContainer() {
  const { slug } = useParams({ from: '/blog/$slug' });
  // slug is typed as string

  const query = useBlogPost(slug);
  // ...
}
```

### Nested Routes (Parent/Child)

Parent routes render children via `<Outlet />`:

```typescript
// src/ui/shared/routes/blog.tsx (parent)
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/blog')({
  component: BlogLayout,
});

function BlogLayout() {
  return (
    <div>
      <h1>Blog</h1>
      <Outlet />  {/* Child routes render here */}
    </div>
  );
}
```

```typescript
// src/ui/shared/routes/blog.index.tsx (default child)
export const Route = createFileRoute('/blog/')({
  component: BlogListContainer,
});
// Matches: /blog (exact)

// src/ui/shared/routes/blog.$slug.tsx (dynamic child)
export const Route = createFileRoute('/blog/$slug')({
  component: BlogPostContainer,
});
// Matches: /blog/my-post
```

### Catch-All Routes

```typescript
// src/ui/shared/routes/$.tsx
export const Route = createFileRoute('/$')({
  component: NotFound,
});
// Matches: any unmatched route
```

## 3. Navigation

### Link Component (Declarative)

```typescript
import { Link } from '@tanstack/react-router';

// Simple link
<Link to="/about">About</Link>

// With path parameters
<Link to="/blog/$slug" params={{ slug: 'my-post' }}>
  Read More
</Link>

// With search parameters
<Link to="/blog" search={{ category: 'tech', page: 1 }}>
  Tech Posts
</Link>

// Active link styling
<Link
  to="/about"
  activeProps={{ className: 'active' }}
  inactiveProps={{ className: 'inactive' }}
>
  About
</Link>
```

### Programmatic Navigation

```typescript
import { useNavigate } from '@tanstack/react-router';

function CreatePostForm() {
  const navigate = useNavigate();

  const handleSubmit = async (data: FormData) => {
    const post = await createPost(data);

    // Navigate after success
    navigate({ to: '/blog/$slug', params: { slug: post.slug } });
  };

  // Go back
  const handleCancel = () => {
    navigate({ to: '..' }); // Parent route
    // or: history.back()
  };
}
```

### Navigation with Search Params

```typescript
// Reading search params
import { useSearch } from '@tanstack/react-router';

function BlogList() {
  const { category, page } = useSearch({ from: '/blog/' });
  // Use for filtering/pagination
}

// Setting search params
const navigate = useNavigate();
navigate({
  to: '/blog',
  search: { category: 'tech', page: 2 },
});

// Updating search params (preserve others)
navigate({
  to: '/blog',
  search: (prev) => ({ ...prev, page: prev.page + 1 }),
});
```

## 4. Route Data Loading

### Loaders (Prefetch Data)

```typescript
// src/ui/shared/routes/blog.$slug.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    // This runs before component renders
    return fetchBlogPost(params.slug);
  },
  component: BlogPost,
});

function BlogPost() {
  const post = Route.useLoaderData();
  // Data is already available, no loading state needed
}
```

### Combining with TanStack Query

For this project, prefer TanStack Query over route loaders for server data:

```typescript
// ✅ Recommended: TanStack Query for data fetching
export const Route = createFileRoute('/blog/$slug')({
  component: BlogPostContainer,
});

function BlogPostContainer() {
  const { slug } = useParams({ from: '/blog/$slug' });
  const query = useBlogPost(slug);

  return (
    <QueryState query={query}>
      {(post) => <BlogPostView post={post} />}
    </QueryState>
  );
}
```

**Why?** TanStack Query provides caching, background refetching, and works with the `QueryState` component pattern.

## 5. Route Guards (Protected Routes)

### Before Load Hook

```typescript
export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    const { auth } = context;

    if (!auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: '/admin' },
      });
    }
  },
  component: AdminDashboard,
});
```

### With Auth Store

```typescript
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';

export const Route = createFileRoute('/admin')({
  beforeLoad: () => {
    const token = useAuthStore.getState().token;

    if (!token) {
      throw redirect({ to: '/' });
    }
  },
  component: AdminDashboard,
});
```

## 6. Pending & Error States

### Pending Navigation

```typescript
import { usePendingComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/blog/$slug')({
  pendingComponent: () => <LoadingSpinner />,
  component: BlogPost,
});
```

### Error Boundaries

```typescript
export const Route = createFileRoute('/blog/$slug')({
  errorComponent: ({ error }) => (
    <div>
      <h2>Error loading post</h2>
      <p>{error.message}</p>
    </div>
  ),
  component: BlogPost,
});
```

## 7. Common Patterns

### Active Link Detection

```typescript
import { Link, useRouterState } from '@tanstack/react-router';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const router = useRouterState();
  const isActive = router.location.pathname === to;

  return (
    <Link to={to} className={isActive ? 'active' : ''}>
      {children}
    </Link>
  );
}
```

### Breadcrumbs

```typescript
import { useMatches } from '@tanstack/react-router';

function Breadcrumbs() {
  const matches = useMatches();

  return (
    <nav>
      {matches.map((match, i) => (
        <span key={match.id}>
          {i > 0 && ' / '}
          <Link to={match.pathname}>{match.pathname}</Link>
        </span>
      ))}
    </nav>
  );
}
```

### 404 Not Found

```typescript
// src/ui/shared/routes/$.tsx
export const Route = createFileRoute('/$')({
  component: () => (
    <div>
      <h1>404 - Page Not Found</h1>
      <Link to="/">Go Home</Link>
    </div>
  ),
});
```

## 8. Testing Routes

See `testing-workflow` skill for full details. Quick reference:

```typescript
import { render } from 'test-utils';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';

// Test component at specific route
const history = createMemoryHistory({ initialEntries: ['/blog/test-slug'] });
render(<RouterProvider router={router} history={history} />);

// Assert navigation occurred
expect(screen.getByText('Test Post')).toBeInTheDocument();
```

## 9. Quick Reference

### File Naming → URL Mapping

| File Name         | URL Path         |
| ----------------- | ---------------- |
| `index.tsx`       | `/`              |
| `about.tsx`       | `/about`         |
| `blog.index.tsx`  | `/blog`          |
| `blog.$slug.tsx`  | `/blog/:slug`    |
| `blog.create.tsx` | `/blog/create`   |
| `$.tsx`           | `/*` (catch-all) |

### Hooks Quick Reference

| Hook             | Purpose                     |
| ---------------- | --------------------------- |
| `useParams`      | Get path parameters         |
| `useSearch`      | Get search query parameters |
| `useNavigate`    | Programmatic navigation     |
| `useRouterState` | Current router state        |
| `useMatches`     | All matched route segments  |
| `useLoaderData`  | Data from route loader      |
