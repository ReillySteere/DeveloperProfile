---
name: doc-review
description: Review newly applied changes to identify if documentation (ADRs, Readmes, Code comments) needs updates.
---

# Documentation Review

Use this skill to analyze code changes and recommend documentation updates.

## 1. When to use

Run this skill after implementing a feature, refactoring code, or fixing a bug.

## 2. Review Checklist

### Architecture Decision Records (ADRs)

- **Trigger:** Did you introduce a new library, change a database schema, or alter an architectural pattern (e.g., adding a new global interceptor)?
- **Action:** Check `architecture/decisions`. If no existing ADR covers this change, recommend creating a new one following the `documentation-standards` skill.

### Component Documentation

- **Trigger:** Did you create a complex feature module (e.g., specific algorithms, state machines) or significantly change an existing one?
- **Action:** Check `architecture/components`. Recommend updating or creating a Markdown file for high-level overviews.

### Module READMEs

- **Trigger:** Did you add a new Feature Module in `src/server/modules` or `src/ui/containers`?
- **Action:** Recommend creating a `README.md` inside that folder explaining the domain logic if it's not trivial.

### Shared Types & API Contracts

- **Trigger:** Did you change `src/shared/types`?
- **Action:** Ensure the JSDoc comments on the types reflect the new reality, as these are the contract between FE and BE.

### Public API (Swagger/OpenAPI)

- **Trigger:** Did you change `src/server/**/*.controller.ts`?
- **Action:** detailed `@ApiOperation` and `@ApiResponse` decorators must be present and accurate.

## 3. Output Format

If documentation updates are needed, list them clearly:

1.  **Missing ADR**: [Reason]
2.  **Outdated Component Doc**: [File] needs [Update details].
3.  **Missing Swagger**: Controller [Name] is missing decorators.
