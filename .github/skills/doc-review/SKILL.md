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

### Shared UI Components

- **Trigger:** Did you add, remove, or rename a component in `src/ui/shared/components/`?
- **Action:** Update the following:
  1. **Barrel export:** Ensure `src/ui/shared/components/index.ts` exports the component
  2. **Architecture doc:** Update `architecture/components/shared-ui.md` with the new component in the appropriate category table
  3. **Usage example:** If the component has non-obvious usage, add an example to the architecture doc

### Public API (Swagger/OpenAPI)

- **Trigger:** Did you change `src/server/**/*.controller.ts`?
- **Action:** detailed `@ApiOperation` and `@ApiResponse` decorators must be present and accurate.

### AI Agent Documentation Consistency

- **Trigger:** Did you modify any file in `.github/` (skills, prompts, copilot-instructions) or `architecture/`?
- **Action:** Cross-reference related documentation for consistency:
  - **Paths:** Verify file paths match actual project structure (`src/ui/containers/`, `src/server/shared/modules/auth/`, etc.)
  - **Patterns:** Ensure code examples follow current conventions (manual DI for unit tests, `ui/test-utils` imports, etc.)
  - **Skills/Prompts:** Check that referenced skills exist and descriptions are accurate
  - **Key Files:** Verify example files still exist and paths are correct

**Files to cross-check:**

| Changed File                     | Also Review                                         |
| -------------------------------- | --------------------------------------------------- |
| `copilot-instructions.md`        | All skills, all prompts                             |
| Any skill in `.github/skills/`   | `copilot-instructions.md`, related prompts          |
| Any prompt in `.github/prompts/` | Related skills, `copilot-instructions.md`           |
| `architecture/decisions/*.md`    | `copilot-instructions.md` if architectural          |
| `architecture/components/*.md`   | Related skills (e.g., `architecture-nav`)           |
| `src/ui/shared/components/*`     | `architecture/components/shared-ui.md`, barrel file |

## 3. Consistency Quick Reference

When reviewing AI agent documentation, verify these commonly-misaligned items:

| Item                     | Correct Value                                     |
| ------------------------ | ------------------------------------------------- |
| Auth location            | `src/server/shared/modules/auth/`                 |
| UI feature folders       | `src/ui/containers/<feature>/`                    |
| Unit test pattern        | Manual DI (e.g., `new Service(mockDep)`)          |
| Unit test example        | `src/server/sentry-exception.filter.test.ts`      |
| Integration test pattern | `Test.createTestingModule` with `:memory:` SQLite |
| UI test imports          | `import { render } from 'ui/test-utils'`          |
| Hook mocking             | Mock `useAuth` (global), don't mock feature hooks |

## 4. Output Format

If documentation updates are needed, list them clearly:

1.  **Missing ADR**: [Reason]
2.  **Outdated Component Doc**: [File] needs [Update details].
3.  **Missing Swagger**: Controller [Name] is missing decorators.
4.  **Inconsistent Path**: [File] references `[wrong]`, should be `[correct]`.
5.  **Outdated Pattern**: [File] shows `[old pattern]`, should use `[new pattern]`.
6.  **Missing Shared Component**: `[ComponentName]` added but not documented in `shared-ui.md`.
