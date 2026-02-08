# ADR-029: Feature Component Playground Strategy

## Status

Accepted

## Date

2026-02-08

## Context

The Component Playground (Phase 1) supports base shared components (Button, Badge, Card, Skeleton, LinkButton) with iframe preview, prop editing, and code generation. Phase 2 extends this to **feature components** — components from performance, accessibility, and case-studies containers that depend on external libraries (recharts, axe-core, react-syntax-highlighter).

Key challenges:

1. Feature components cannot render in sandboxed iframes — they need their runtime dependencies (recharts, axe-core, etc.)
2. Some feature components are self-contained (no props) and need different UX treatment
3. Dependency cruiser rules enforce container isolation, but the playground must import from other containers
4. Complex props (arrays of objects, nested types) need a different editing experience than simple strings/booleans

## Decision

### Dual Render Mode

Components declare a `renderMode` field in their metadata:

- `iframe` (default): Existing sandboxed iframe rendering for base shared components
- `direct`: React.lazy rendering within the playground process for feature components

### Component Registry

A `ComponentRegistry` maps component names to `React.lazy()` imports, enabling code-splitting. Only feature components with `renderMode: 'direct'` use this registry.

### Self-Contained Components

Components with `selfContained: true` (AxeAuditPanel, ContrastChecker) render as live demos without a prop editor. An informational note replaces the prop panel.

### Sample Data

Feature components with complex props include `sampleData` in their metadata. This provides realistic default values that are merged into the prop editor on load.

### Composition Templates

Predefined JSON templates combine multiple feature components into dashboard-like layouts. Templates are restricted to predefined configurations — no arbitrary code execution. Layouts use CSS Grid with data-attributes for template-driven positioning.

### Dependency Cruiser Exceptions

The playground container receives explicit exceptions in `feature-isolation` and `feature-components-internal-only` rules, allowing it to import components from other containers.

## Consequences

- Feature components get full playground support without iframe limitations
- Code-splitting via React.lazy keeps the playground bundle lean
- Self-contained components provide immediate value without prop configuration
- Composition templates demonstrate realistic component integration patterns
- Dependency cruiser exceptions are scoped narrowly to the playground container only
