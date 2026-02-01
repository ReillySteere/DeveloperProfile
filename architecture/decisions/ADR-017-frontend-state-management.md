# ADR-017: Frontend State Management Strategy

## Status

Accepted - February 1, 2026

## Context

Modern React applications require careful state management across different concerns:
server data, global UI state, and local component state. The choice of state management
solution impacts code complexity, bundle size, and developer experience.

### State Categories

| Category     | Examples                          | Characteristics                   |
| ------------ | --------------------------------- | --------------------------------- |
| Server State | API responses, cached data        | Async, cacheable, stale-able      |
| Global UI    | Auth status, theme, navigation    | Sync, app-wide, persistent        |
| Local UI     | Form inputs, toggles, hover state | Sync, component-scoped, ephemeral |

### Options Considered

| Solution       | Pros                               | Cons                                |
| -------------- | ---------------------------------- | ----------------------------------- |
| Redux + RTK    | Mature, predictable, DevTools      | Boilerplate, complexity overhead    |
| Redux + Query  | RTK Query for server state         | Still requires Redux infrastructure |
| Zustand        | Minimal API, no boilerplate        | Less ecosystem, newer               |
| TanStack Query | Best-in-class server state         | Only handles server state           |
| Context API    | Built-in, no dependencies          | Performance issues at scale         |
| Jotai/Recoil   | Atomic state, fine-grained updates | Different mental model              |

## Decision

Adopt **TanStack Query for server state** and **Zustand for global UI state**, deliberately
excluding Redux.

### 1. State Ownership Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     State Ownership                              │
├─────────────────────────────────────────────────────────────────┤
│  Server State (TanStack Query)                                  │
│  • API data fetching and caching                                │
│  • Background refetching                                        │
│  • Stale-while-revalidate                                       │
│  • Optimistic updates                                           │
├─────────────────────────────────────────────────────────────────┤
│  Global UI State (Zustand)                                      │
│  • Authentication (token, user, isAuthenticated)                │
│  • Navigation (activeSection, theme)                            │
│  • Modals (isLoginModalOpen, authError)                         │
├─────────────────────────────────────────────────────────────────┤
│  Local UI State (useState)                                      │
│  • Form inputs                                                  │
│  • Component toggles                                            │
│  • Hover/focus states                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Why Not Redux?

**Deliberate exclusion** to minimize frontend complexity:

| Redux Concern             | Our Approach                                  |
| ------------------------- | --------------------------------------------- |
| Action creators           | Not needed with TanStack Query mutations      |
| Reducers                  | Zustand's `set()` is simpler                  |
| Middleware (thunks/sagas) | TanStack Query handles async natively         |
| Normalized cache          | TanStack Query cache is sufficient            |
| DevTools                  | Both Zustand and TanStack Query have DevTools |

**Philosophy**: Offload complexity to the backend where possible. Frontend should be thin,
with business logic living in NestJS services. We don't anticipate multi-tenant complexity
that would require sophisticated client-side state management.

### 3. TanStack Query Patterns

#### Query Keys Strategy

Use **array-based keys** for hierarchical invalidation:

```typescript
// Hierarchical keys enable selective invalidation
const blogKeys = {
  all: ['blog'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (filters: string) => [...blogKeys.lists(), filters] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (slug: string) => [...blogKeys.details(), slug] as const,
};

// Usage in hooks
useQuery({ queryKey: blogKeys.detail(slug), queryFn: () => fetchPost(slug) });

// Invalidation
queryClient.invalidateQueries({ queryKey: blogKeys.lists() }); // All lists
queryClient.invalidateQueries({ queryKey: blogKeys.all }); // Everything
```

#### Custom Hooks

Encapsulate TanStack Query usage in custom hooks:

```typescript
// src/ui/containers/blog/hooks/useBlog.ts
export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: fetchBlogPosts,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBlogPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}
```

### 4. Zustand Patterns

#### Store Definition

```typescript
// src/ui/shared/hooks/useAuthStore.ts
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: { username: string } | null;
  isLoginModalOpen: boolean;
  authError: string | null;

  // Actions
  login: (token: string, username: string) => void;
  logout: () => void;
  openLoginModal: (message?: string) => void;
  closeLoginModal: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      isLoginModalOpen: false,
      authError: null,

      login: (token, username) =>
        set({
          isAuthenticated: true,
          token,
          user: { username },
          isLoginModalOpen: false,
          authError: null,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          token: null,
          user: null,
        }),

      openLoginModal: (message) =>
        set({
          isLoginModalOpen: true,
          authError: message ?? null,
        }),

      closeLoginModal: () =>
        set({
          isLoginModalOpen: false,
          authError: null,
        }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
        // Don't persist modal state
      }),
    },
  ),
);
```

#### Selective Persistence

Use `partialize` to persist only stable state, not transient UI state:

```typescript
persist(storeDefinition, {
  name: 'store-name',
  partialize: (state) => ({
    // Only these keys go to localStorage
    isAuthenticated: state.isAuthenticated,
    token: state.token,
  }),
});
```

#### Access Outside React

Zustand enables store access outside React components:

```typescript
// In AuthInterceptor (axios interceptor)
const token = useAuthStore.getState().token;

// In tests
useAuthStore.setState({ isAuthenticated: true, token: 'test-token' });
```

### 5. Provider Setup

```typescript
// src/ui/index.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      retry: 1,
    },
  },
});

root.render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthInterceptor />
      <SignInModal />
      <RouterProvider router={router} />
    </ThemeProvider>
  </QueryClientProvider>
);
```

## Consequences

### Positive

- **Simplicity**: No Redux boilerplate, actions, or reducers
- **Separation**: Clear ownership of different state types
- **Performance**: Fine-grained subscriptions (Zustand), smart caching (Query)
- **DX**: Great DevTools for both libraries
- **Bundle size**: Smaller than Redux + RTK Query combined

### Negative

- **Two libraries**: Must understand both TanStack Query and Zustand
- **Less ecosystem**: Fewer middleware/plugins than Redux
- **Backend dependency**: Complex logic pushed to server requires API changes

### Trade-offs Accepted

| Trade-off                    | Rationale                                  |
| ---------------------------- | ------------------------------------------ |
| Less client-side flexibility | Backend-first approach preferred           |
| Smaller ecosystem            | Simpler mental model, sufficient for needs |
| Two state libraries          | Each excels at its specific domain         |

## Related Documentation

- [State Management Skill](../../.github/skills/state-management/SKILL.md)
- [TanStack Query Documentation](https://tanstack.com/query)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
