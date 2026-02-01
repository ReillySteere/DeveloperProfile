# ADR-019: Styling Architecture

## Status

Accepted - February 1, 2026

## Context

Frontend styling requires decisions about methodology, tooling, and design token management.
The choice affects developer experience, bundle size, runtime performance, and the ability
to support theming.

### Requirements

1. **Theming**: Support light and dark modes
2. **Isolation**: Styles scoped to components to prevent conflicts
3. **Performance**: Minimal runtime overhead
4. **Maintainability**: Clear patterns, easy to update design tokens
5. **Familiarity**: Leverage existing team knowledge

### Options Considered

| Approach            | Pros                             | Cons                          |
| ------------------- | -------------------------------- | ----------------------------- |
| CSS-in-JS (styled)  | Co-located, dynamic              | Runtime overhead, bundle size |
| CSS-in-JS (Emotion) | Flexible, good DX                | Similar runtime concerns      |
| Tailwind CSS        | Rapid development, utility-first | Verbose JSX, learning curve   |
| CSS Modules         | Zero runtime, native CSS         | Less dynamic, separate files  |
| SCSS Modules        | CSS Modules + preprocessing      | Build step required           |
| Vanilla Extract     | Type-safe, zero runtime          | More complex setup            |

## Decision

Adopt **SCSS Modules** with **CSS Custom Properties** (CSS Variables) for design tokens,
and **data attributes** for theming.

### 1. Why SCSS Modules

Selected based on:

- **Developer familiarity**: Team has SCSS experience
- **Zero runtime**: No JavaScript overhead for styles
- **Scoped by default**: CSS Modules prevent class conflicts
- **Preprocessing**: Nesting, mixins, functions available
- **Clear separation**: Styles separate from component logic

**Why not CSS-in-JS?**

While CSS-in-JS offers co-location benefits, the runtime overhead and bundle size
impact were deemed unnecessary for a project with a narrow theming scope (two themes).
SCSS Modules provide sufficient capability without these costs.

### 2. Design Token System

#### Token Hierarchy

```css
/* src/ui/shared/styles/tokens.css */

:root {
  /* Layer 1: Primitive Palette */
  --color-slate-50: #f8fafc;
  --color-slate-100: #f1f5f9;
  --color-slate-900: #0f172a;
  --color-slate-950: #020617;

  --color-indigo-600: #4f46e5;
  --color-indigo-700: #4338ca;

  --color-red-500: #ef4444;
  --color-green-500: #22c55e;

  /* Layer 2: Semantic Tokens */
  --bg-app: var(--color-slate-50);
  --bg-surface: white;
  --bg-hover: var(--color-slate-100);

  --text-primary: var(--color-slate-900);
  --text-secondary: var(--color-slate-600);
  --text-muted: var(--color-slate-500);

  --border-default: var(--color-slate-200);
  --border-strong: var(--color-slate-300);

  --primary-default: var(--color-indigo-600);
  --primary-hover: var(--color-indigo-700);

  --color-danger: var(--color-red-500);
  --color-success: var(--color-green-500);

  /* Layer 3: Spacing Scale */
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */

  /* Layer 4: Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;

  /* Layer 5: Transitions */
  --transition-fast: all 0.15s ease-in-out;
  --transition-base: all 0.2s ease-in-out;
  --transition-slow: all 0.3s ease-in-out;

  /* Layer 6: Layout */
  --content-width: 1100px;
}
```

#### Dark Mode via Data Attribute

```css
[data-theme='dark'] {
  --bg-app: var(--color-slate-950);
  --bg-surface: var(--color-slate-900);
  --bg-hover: var(--color-slate-800);

  --text-primary: var(--color-slate-50);
  --text-secondary: var(--color-slate-400);
  --text-muted: var(--color-slate-500);

  --border-default: var(--color-slate-700);
  --border-strong: var(--color-slate-600);
}
```

### 3. SCSS Module Patterns

#### Component Styling

```scss
// components/Card/Card.module.scss
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  transition: var(--transition-base);

  &:hover {
    border-color: var(--border-strong);
  }
}

.title {
  color: var(--text-primary);
  font-size: 1.125rem;
  margin-bottom: var(--space-2);
}
```

#### Usage in Components

```typescript
import styles from './Card.module.scss';

export function Card({ title, children }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      {children}
    </div>
  );
}
```

### 4. Theming Implementation

```typescript
// src/ui/shared/components/ThemeProvider/ThemeProvider.tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useNavStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
}
```

### 5. Rules and Conventions

| Rule                             | Rationale                                |
| -------------------------------- | ---------------------------------------- |
| Never hardcode colors            | Use semantic tokens for consistency      |
| Never hardcode spacing           | Use `--space-*` scale for rhythm         |
| Use semantic tokens over palette | `--text-primary` not `--color-slate-900` |
| Module per component             | Scope styles to prevent conflicts        |
| No global styles except tokens   | Maintain style isolation                 |

### 6. Future Considerations

**Potential enhancement**: Programmatically swap style modules via lazy-loading for
advanced theming scenarios (e.g., user-customizable themes). The current CSS variable
approach supports this as a foundation.

## Consequences

### Positive

- **Zero runtime**: No JavaScript overhead for styles
- **Type safety**: CSS Module class names are typed via declaration files
- **Familiar tooling**: Standard SCSS, no new paradigms
- **Easy theming**: CSS variables update instantly
- **Performance**: CSS cached separately from JavaScript

### Negative

- **Separate files**: Styles not co-located with component logic
- **Less dynamic**: Can't compute styles based on props easily
- **Build step**: SCSS compilation required

### Trade-offs Accepted

| Trade-off                   | Rationale                                   |
| --------------------------- | ------------------------------------------- |
| Separate style files        | Acceptable for clear separation of concerns |
| Less dynamic than CSS-in-JS | Sufficient for two-theme requirement        |
| SCSS build step             | Already in Webpack pipeline                 |

## Related Documentation

- [Design Tokens File](../../src/ui/shared/styles/tokens.css)
- [Shared UI Components](../components/shared-ui.md)
