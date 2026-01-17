# Shared UI Components Architecture

## Overview

The Shared UI layer provides reusable components, hooks, and stores that are used across multiple features. All components follow a consistent pattern using functional React components, SCSS Modules for styling, and TypeScript for type safety.

## Location

```
src/ui/shared/
├── components/      # Reusable UI components
│   ├── AuthInterceptor/
│   ├── Badge/
│   ├── Button/
│   ├── Card/
│   ├── Frame/
│   ├── LinkButton/
│   ├── NavigationRail/
│   ├── QueryState/
│   ├── SignIn/
│   ├── Skeleton/
│   └── index.ts     # Barrel export
├── hooks/           # Shared hooks (includes Zustand stores)
│   ├── useAuth.ts
│   ├── useAuthStore.ts   # Zustand store for auth state
│   ├── useDateFormatter.ts
│   └── useNavStore.ts    # Zustand store for nav state
└── routes/          # TanStack Router route definitions
```

## Import Convention

**Always import shared components from the barrel file:**

```typescript
// ✅ Correct - use barrel export
import { Button, Card, Frame, QueryState } from 'ui/shared/components';

// ❌ Wrong - don't import directly from component folders
import { Button } from 'ui/shared/components/Button/Button';
```

## Component Catalog

### Layout Components

| Component        | Purpose                                             | Usage             |
| ---------------- | --------------------------------------------------- | ----------------- |
| `Frame`          | Page layout wrapper with consistent padding/margins | Wrap page content |
| `NavigationRail` | Side navigation menu                                | App-level layout  |

### Data Display

| Component     | Purpose                                | Usage                     |
| ------------- | -------------------------------------- | ------------------------- |
| `Card`        | Content container with optional header | Feature cards, list items |
| `CardHeader`  | Card header section                    | With `Card`               |
| `CardTitle`   | Card title text                        | With `CardHeader`         |
| `CardContent` | Card body section                      | With `Card`               |
| `Badge`       | Small label/tag                        | Tags, status indicators   |
| `Skeleton`    | Loading placeholder                    | While data is loading     |

### Interactive

| Component    | Purpose               | Usage                     |
| ------------ | --------------------- | ------------------------- |
| `Button`     | Standard button       | Actions, form submissions |
| `LinkButton` | Button styled as link | Navigation actions        |

### State Management

| Component         | Purpose                                               | Usage                   |
| ----------------- | ----------------------------------------------------- | ----------------------- |
| `QueryState`      | Handles loading/error/empty states for TanStack Query | Wrap query-dependent UI |
| `AuthInterceptor` | Global Axios interceptor for auth                     | Mount once at app root  |

### Auth UI

| Component | Purpose                | Usage               |
| --------- | ---------------------- | ------------------- |
| `SignIn`  | Login modal and button | Authentication flow |

## QueryState Component

The `QueryState` component simplifies handling TanStack Query states:

```tsx
import { QueryState } from 'ui/shared/components';
import { useBlogPosts } from './hooks/useBlog';

export const BlogContainer = () => {
  const { data, isLoading, isError, error } = useBlogPosts();

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={!data?.length}
      emptyMessage="No blog posts yet"
    >
      {/* Rendered only when data is available */}
      {data?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </QueryState>
  );
};
```

## Styling with SCSS Modules

Each component has its own SCSS Module file:

```
Button/
├── Button.tsx
└── Button.module.scss
```

### Usage Pattern

```tsx
// Button.tsx
import styles from './Button.module.scss';

export const Button = ({ children, variant = 'primary' }) => (
  <button className={`${styles.button} ${styles[variant]}`}>{children}</button>
);
```

### Naming Conventions

- Use camelCase for class names in SCSS
- Compose styles using `composes` when extending
- Keep styles component-scoped

## Shared Hooks

### useAuthStore

Zustand store for authentication state. See [auth.md](./auth.md) for details.

### useNavStore

Zustand store for navigation state (e.g., mobile menu open/closed).

### useDateFormatter

Utility hook for consistent date formatting:

```typescript
const { formatDate } = useDateFormatter();
const formatted = formatDate('2026-01-17'); // "January 17, 2026"
```

## Adding New Shared Components

1. Create a folder: `src/ui/shared/components/NewComponent/`
2. Add component file: `NewComponent.tsx`
3. Add styles: `NewComponent.module.scss`
4. Export from barrel: Update `src/ui/shared/components/index.ts`

```typescript
// index.ts
export { NewComponent } from './NewComponent/NewComponent';
```

## Testing Shared Components

- Complex shared components may have their own unit tests
- Simple components are tested through container integration tests
- Use `render` from `ui/test-utils` which wraps `QueryClientProvider`

```typescript
import { render, screen } from 'ui/test-utils';
import { Button } from 'ui/shared/components';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## Related Documentation

- [auth.md](./auth.md) - Authentication-specific components
- [Testing Workflow Skill](../../.github/skills/testing-workflow/SKILL.md) - Testing patterns
