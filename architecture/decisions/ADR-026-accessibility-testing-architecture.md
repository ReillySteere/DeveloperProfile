# ADR-026: Accessibility Testing Architecture

## Status

Proposed - February 7, 2026

## Context

The Accessibility Showcase (PLAN-1.3) requires decisions about how to test, audit, and verify
WCAG 2.1 AA compliance across the portfolio site. Accessibility testing spans multiple layers:
static analysis, unit tests, integration tests, and manual verification.

### Key Questions

1. **Audit engine**: Which tool for runtime accessibility auditing?
2. **Test integration**: How to verify a11y in existing Jest + Playwright pipelines?
3. **CI/CD gating**: Should builds fail on accessibility violations?
4. **Manual testing**: What cannot be automated?

## Decision

### 1. Use axe-core for runtime auditing

[axe-core](https://github.com/dequelabs/axe-core) is the industry standard accessibility engine
used by Lighthouse, Chrome DevTools, and most a11y testing tools. It provides:

- Comprehensive WCAG 2.1 AA rule coverage
- Zero false positives by design (high confidence results)
- Detailed remediation guidance with Deque University links
- Configurable rule sets and context scoping

**Alternative considered**: Pa11y (headless browser auditing). Rejected because axe-core integrates
directly into both Jest (via jest-axe) and Playwright (via @axe-core/playwright), matching our
existing test infrastructure.

### 2. Three-layer test integration

| Layer           | Tool                        | Purpose                                                 |
| --------------- | --------------------------- | ------------------------------------------------------- |
| **Unit**        | `jest-axe`                  | Verify individual components don't introduce violations |
| **Integration** | `@testing-library/jest-dom` | Assert ARIA attributes, roles, and accessible names     |
| **E2E**         | `@axe-core/playwright`      | Full-page audits in real browser context                |

Component-level tests use `jest-axe` to catch regressions early. Container integration tests
verify ARIA attributes and keyboard behavior with Testing Library. E2E tests run full-page
axe audits against every route.

**Alternative considered**: Only E2E-level auditing. Rejected because shifting left catches
issues faster and provides better developer feedback loops.

### 3. Advisory CI gating (warn, don't block)

Initially, accessibility violations produce warnings in CI rather than blocking merges.
This allows the team to establish a baseline and fix existing issues incrementally.

- **Phase 1** (current): Warn on violations, track score over time
- **Phase 2** (future): Block on critical/serious violations
- **Phase 3** (future): Block on any new violations (ratchet)

### 4. Manual testing checklist

Automated tools catch approximately 30-50% of accessibility issues. The remaining require
manual verification:

- Screen reader testing (NVDA on Windows, VoiceOver on macOS)
- Keyboard-only navigation through all user flows
- Zoom to 200% without loss of content or functionality
- Reduced motion preference respected
- Color not used as the sole means of conveying information

## Consequences

### Positive

- Consistent tooling across all test layers (axe-core ecosystem)
- Shift-left approach catches issues before they reach E2E
- Incremental adoption via advisory-first CI gating
- Clear manual testing requirements for what automation misses

### Negative

- Additional test dependencies (jest-axe, @axe-core/playwright)
- axe-core cannot catch all WCAG violations (manual testing still required)
- Advisory-only CI means violations could be merged initially

## References

- [axe-core](https://github.com/dequelabs/axe-core)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [ADR-015: Testing Strategy](./ADR-015-testing-strategy.md)
- [ADR-016: Test Utilities Architecture](./ADR-016-test-utilities-architecture.md)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
