# AI Instructions Changelog

This file tracks significant changes to AI agent documentation (skills, prompts, chat modes, and copilot instructions).

---

## 2026-02-01 (Prompt Consolidation)

### Prompts Added

- `implement.prompt.md` - Full AI workflow: assess → clarify → plan → implement → test → review → PR(s)
- `validate.prompt.md` - Merged validation and code review checks (replaces `validate-changes` and `pre-push-review`)

### Prompts Removed

- `pre-push-review.prompt.md` - Merged into `validate.prompt.md`
- `validate-changes.prompt.md` - Merged into `validate.prompt.md`
- `scaffold-feature.prompt.md` - Absorbed into `write-code.prompt.md`

### Prompts Updated

- `write-code.prompt.md` - Streamlined and absorbed scaffolding patterns from `scaffold-feature`
- `doc-audit.prompt.md` - Updated references to new `validate` prompt

### Skills Updated

- `README.md` - Updated workflow section to reference `validate` prompt

### Other Changes

- Updated `copilot-instructions.md` to reference new `validate` and `implement` prompts

---

## 2026-01-17 (Phase 1-5 Implementation)

### Skills Added

- `error-handling` - Debug TypeScript, Jest, ESLint, and dependency errors
- `code-review` - Review code for quality, security, and project patterns
- `database-migration` - Create, run, and troubleshoot TypeORM migrations
- `api-design` - Design RESTful endpoints with Swagger and validation

### Prompts Added

- `build-debug.prompt.md` - Diagnose and fix build/test failures
- `doc-audit.prompt.md` - Comprehensive documentation verification
- `create-pr.prompt.md` - Branch creation and PR workflow
- `refactor.prompt.md` - Safe refactoring patterns

### Chat Modes Added

- `onboarding.chatmode.md` - Guide new contributors through codebase

### Architecture Docs Added

- `auth.md` - Authentication architecture (JWT, AuthInterceptor)
- `shared-ui.md` - Shared UI component catalog

### Skills Enhanced

- `testing-workflow` - Added VS Code tasks, concrete examples
- `feature-scaffold` - Fixed UI path (`src/ui/containers/`)
- `architecture-nav` - Fixed Auth UI path, added examples
- `dependency-enforcement` - Added VS Code task references
- `documentation-standards` - Added maintenance checklist and ADR template
- `doc-review` - Added cross-reference table, shared component triggers

### Other Changes

- Created `.github/skills/README.md` with decision tree and skill categories
- Updated `copilot-instructions.md` with documentation consistency and pre-push audit guidelines
- Updated `CONTRIBUTING.md` with AI tooling section, fixed paths and extensions list
- Fixed outdated paths in `blog.md`, `experience.md`, `projects.md`, `about.md`

---

## Format for Future Entries

```markdown
## YYYY-MM-DD (Description)

### Skills Added/Modified

- `skill-name` - Brief description of change

### Prompts Added/Modified

- `prompt-name.prompt.md` - Brief description of change

### Other Changes

- Description of other changes
```
