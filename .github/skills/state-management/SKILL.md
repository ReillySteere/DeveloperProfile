---
name: state-management
description: Guide for using Zustand (global state) and TanStack Query (server state) effectively.
---

# State Management

Use this skill when deciding where to put state or implementing data fetching.

## 1. When to Use What

| State Type        | Tool            | Examples                                    |
| ----------------- | --------------- | ------------------------------------------- |
| Server data       | TanStack Query  | Blog posts, experiences, projects, API data |
| UI state (global) | Zustand         | Nav open/closed, theme, modal visibility    |
| UI state (local)  | useState        | Form inputs, local toggles, loading state   |
| URL state         | TanStack Router | Filters, pagination, current page, slug     |
| Auth state        | Zustand + Query | Token in Zustand, user data from Query      |

### Decision Flowchart

```
Does the data come from an API?
├─ Yes → TanStack Query
└─ No → Does multiple components need it?
         ├─ Yes → Should it persist in URL?
         │        ├─ Yes → TanStack Router (search params)
         │        └─ No → Zustand
         └─ No → useState
```

## 2. TanStack Query Patterns

### Query Hook Pattern (This Project)

All API data fetching follows this pattern in `hooks/use<Feature>.ts`:

```typescript
// src/ui/containers/experience/hooks/useExperience.ts
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Experience } from 'shared/types/experience';

export function useExperience() {
  return useQuery<Experience[]>({
    queryKey: ['experience'],
    queryFn: async () => {
      const { data } = await axios.get<Experience[]>('/api/experience');
      return data;
    },
  });
}
```

**Key Points:**

- One hook per feature domain
- Hook returns the full query object (`{ data, isLoading, isError, error }`)
- Use `QueryState` component to handle loading/error/empty states

### Query Keys

Use consistent, hierarchical keys:

```typescript
// ✅ Good: Consistent key factory pattern
const queryKeys = {
  all: ['blog'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: Filters) => [...queryKeys.lists(), filters] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (slug: string) => [...queryKeys.details(), slug] as const,
};

// Usage
useQuery({ queryKey: queryKeys.detail(slug), ... });

// ❌ Bad: Inconsistent keys
useQuery({ queryKey: ['posts'], ... });
useQuery({ queryKey: ['blog-posts'], ... });  // Different key for same data!
```

### Cache Strategies

```typescript
// Default: Data refetches on window focus
useQuery({
  queryKey: ['experience'],
  queryFn: fetchExperience,
});

// Stable data: Rarely changes (e.g., about page content)
useQuery({
  queryKey: ['about'],
  queryFn: fetchAbout,
  staleTime: 1000 * 60 * 60, // Fresh for 1 hour
  gcTime: 1000 * 60 * 60 * 24, // Keep in cache 24 hours
});

// Real-time data: Frequent updates needed
useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  refetchInterval: 30000, // Poll every 30 seconds
});
```

| Setting           | Purpose                                 | Default   |
| ----------------- | --------------------------------------- | --------- |
| `staleTime`       | How long until data is considered stale | 0         |
| `gcTime`          | How long inactive data stays in cache   | 5 minutes |
| `refetchInterval` | Poll interval (ms), false to disable    | false     |
| `enabled`         | Whether to run the query                | true      |

### Mutations

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPost: CreateBlogPostDto) => {
      const { data } = await axios.post('/api/blog', newPost);
      return data;
    },
    onSuccess: () => {
      // Invalidate to refetch blog list
      queryClient.invalidateQueries({ queryKey: ['blog'] });
    },
  });
}

// Usage in component
const mutation = useCreateBlogPost();

const handleSubmit = () => {
  mutation.mutate(
    { title, content },
    {
      onSuccess: () => navigate({ to: '/blog' }),
      onError: (error) => toast.error(error.message),
    },
  );
};
```

### Optimistic Updates

```typescript
useMutation({
  mutationFn: updatePost,
  onMutate: async (updatedPost) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['blog', updatedPost.id] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['blog', updatedPost.id]);

    // Optimistically update
    queryClient.setQueryData(['blog', updatedPost.id], updatedPost);

    return { previous };
  },
  onError: (err, updatedPost, context) => {
    // Rollback on error
    queryClient.setQueryData(['blog', updatedPost.id], context?.previous);
  },
  onSettled: () => {
    // Always refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['blog'] });
  },
});
```

## 3. Zustand Patterns

### Store Structure

This project has focused stores in `src/ui/shared/stores/`:

```typescript
// src/ui/shared/hooks/useNavStore.ts
import { create } from 'zustand';

interface NavState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export const useNavStore = create<NavState>((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
}));
```

**Key Principles:**

- One store per domain (auth, nav, theme)
- Keep stores small and focused
- Actions are defined inside the store

### Selectors (Performance)

```typescript
// ❌ Bad: Subscribes to entire store (re-renders on any change)
const { isOpen, userName, theme } = useNavStore();

// ✅ Good: Subscribe only to what you need
const isOpen = useNavStore((state) => state.isOpen);
const toggle = useNavStore((state) => state.toggle);

// ✅ Better: Multiple selectors with shallow comparison
import { useShallow } from 'zustand/react/shallow';

const { isOpen, toggle } = useNavStore(
  useShallow((state) => ({
    isOpen: state.isOpen,
    toggle: state.toggle,
  })),
);
```

### Auth Store Pattern

```typescript
// src/ui/shared/hooks/useAuthStore.ts
interface AuthState {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  logout: () => set({ token: null }),
}));
```

**Important:** The `AuthInterceptor` component handles token injection automatically. Never manually add Authorization headers in your API hooks.

### Persist State

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist<ThemeState>(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage', // localStorage key
    },
  ),
);
```

## 4. QueryState Component

This project provides a `QueryState` component to handle loading/error/empty states consistently:

```typescript
import { QueryState } from 'ui/shared/components';

function ExperienceContainer() {
  const query = useExperience();

  return (
    <QueryState
      query={query}
      empty={<p>No experiences found</p>}
    >
      {(data) => (
        <ExperiencePage experiences={data} />
      )}
    </QueryState>
  );
}
```

**Benefits:**

- Consistent loading spinners
- Consistent error handling
- Type-safe data in render callback

## 5. Common Mistakes

### ❌ Duplicating Server State in Zustand

```typescript
// ❌ Wrong: Copying server data to Zustand
const posts = useBlogPosts();
useEffect(() => {
  if (posts.data) {
    setBlogPosts(posts.data); // Unnecessary duplication!
  }
}, [posts.data]);

// ✅ Correct: Use TanStack Query as source of truth
const { data: posts } = useBlogPosts();
// Access posts.data directly
```

### ❌ Not Invalidating After Mutations

```typescript
// ❌ Wrong: UI won't update after mutation
useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    toast.success('Created!');
    // Forgot to invalidate - list is stale!
  },
});

// ✅ Correct: Invalidate related queries
useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['blog'] });
  },
});
```

### ❌ Over-fetching (Missing `enabled`)

```typescript
// ❌ Wrong: Fetches even when slug is undefined
function BlogPost() {
  const { slug } = useParams();
  const query = useBlogPost(slug); // Runs with undefined slug!
}

// ✅ Correct: Wait until we have the slug
function BlogPost() {
  const { slug } = useParams();
  const query = useBlogPost(slug, { enabled: !!slug });
}
```

### ❌ Wrong Query Key Invalidation

```typescript
// ❌ Wrong: Typo in key, nothing invalidates
queryClient.invalidateQueries({ queryKey: ['blogs'] }); // Should be 'blog'

// ✅ Correct: Use query key factory
queryClient.invalidateQueries({ queryKey: queryKeys.all });
```

## 6. Debugging State

### TanStack Query DevTools

Already configured in this project. Look for the floating React Query logo in dev mode.

- View all queries and their status
- Inspect cached data
- Manually refetch/invalidate
- See stale/fresh/fetching states

### Zustand DevTools

```typescript
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set) => ({ ... }),
    { name: 'NavStore' }  // Shows in Redux DevTools
  )
);
```

### Console Debugging

```typescript
// Temporary debugging (remove before commit)
const query = useExperience();
console.log('[useExperience]', {
  status: query.status,
  data: query.data,
  error: query.error,
});
```
