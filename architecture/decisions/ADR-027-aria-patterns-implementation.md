# ADR-027: ARIA Patterns Implementation

## Status

Proposed - February 7, 2026

## Context

The Accessibility Showcase demonstrates correct ARIA usage through interactive examples. Decisions
are needed about which patterns to implement, how to present them, and how to ensure the demos
themselves are accessible.

### Key Questions

1. **Pattern selection**: Which ARIA patterns to demonstrate?
2. **Presentation**: Live interactive demos vs static code examples?
3. **Compliance**: How to verify demos follow the APG (ARIA Authoring Practices Guide)?
4. **Component strategy**: Enhance existing components or build showcase-only demos?

## Decision

### 1. Focus on patterns already used in the portfolio

Rather than building abstract demos, the showcase highlights ARIA patterns that exist in the
portfolio's own components. This provides authentic, production-grade examples:

| Pattern             | Portfolio Component    | Key ARIA Features                                  |
| ------------------- | ---------------------- | -------------------------------------------------- |
| Navigation landmark | `NavigationRail`       | `aria-label`, `aria-expanded`, `role="navigation"` |
| Main landmark       | `Frame`                | `<main>` element, skip link target                 |
| Modal dialog        | `SignInModal`          | Focus trap, `aria-modal`, escape to close          |
| Loading state       | `Skeleton`             | `role="status"`, `aria-busy`, `aria-label`         |
| Semantic cards      | `Card`                 | Optional `<article>` element via `as` prop         |
| Disabled controls   | `LinkButton`, `Button` | `aria-disabled` instead of `disabled` attribute    |

**Alternative considered**: Implementing standalone APG reference examples (tabs, combobox, menu).
Deferred to a future iteration — the portfolio's own components provide more authentic
demonstrations of accessibility-first architecture.

### 2. Both live demos and annotated code

Each pattern is presented with:

- **Live interactive demo**: Users can interact and observe behavior
- **Annotated code**: Key ARIA attributes highlighted with explanations
- **Screen reader preview**: Shows what assistive technology announces
- **APG reference link**: Points to the authoritative W3C documentation

### 3. Self-verification via axe-core

Every demo component is audited by axe-core both in tests and at runtime in the showcase.
This creates a self-proving system — the demos verify their own accessibility.

```typescript
// Each demo verifies itself
const results = await runAccessibilityAudit({ context: demoElement });
expect(results.violations).toHaveLength(0);
```

### 4. Enhance existing components, don't fork

Accessibility improvements are made directly to shared components rather than creating
showcase-specific copies. This ensures:

- Production components benefit from the improvements
- No drift between demos and actual implementations
- Changes are tested by existing component test suites

Enhancements already applied:

- `Frame`: `<section>` → `<main>` with `id="main-content"` skip link target
- `Skeleton`: Added `role="status"`, `aria-busy="true"`, configurable `aria-label`
- `Card`: Added polymorphic `as` prop for `<article>` rendering
- Root layout: Added skip-to-main-content link

## Consequences

### Positive

- Authentic examples from production code, not contrived demos
- Self-verifying demos via axe-core integration
- Shared components improve for all consumers
- Clear path to add more patterns incrementally

### Negative

- Limited to patterns used in the portfolio (not a comprehensive APG reference)
- Shared component changes require broader regression testing
- Screen reader simulation is approximate (not a true AT)

## References

- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [ADR-018: Container Component Pattern](./ADR-018-container-component-pattern.md)
- [ADR-019: Styling Architecture](./ADR-019-styling-architecture.md)
- [ADR-026: Accessibility Testing Architecture](./ADR-026-accessibility-testing-architecture.md)
