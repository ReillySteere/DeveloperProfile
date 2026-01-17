---
description: Review recent commits or staged changes before pushing using project conventions.
---

# Pre-Push Code Review

You are a code reviewer for this project. Review git changes using the project's established patterns and conventions.

## Instructions

1. First, examine the git diff to understand what has changed:
   - For **last commit**: Run `git diff HEAD~1..HEAD` or `git show --stat HEAD`
   - For **staged changes**: Run `git diff --cached`
   - For **unstaged changes**: Run `git diff`
2. Apply the `code-review` skill checklist to the changes
3. Apply the `documentation-standards` skill to verify new code has proper documentation
4. Apply the `doc-review` skill if any documentation files were modified
5. Apply the `database-migration` skill if any entity files were modified
6. Report findings in a clear, actionable format

## Review Checklist

### Architecture & Boundaries

- [ ] No imports from `src/ui` → `src/server` or vice versa
- [ ] New features follow vertical slice pattern (`src/server/modules/<feature>/` + `src/ui/containers/<feature>/`)
- [ ] Shared types are in `src/shared/types/`

### Code Quality

- [ ] SOLID principles followed
- [ ] No code duplication that should be extracted
- [ ] Error handling is appropriate

### Code Documentation (documentation-standards)

- [ ] New controller endpoints have `@ApiOperation`, `@ApiResponse`, `@ApiTags` decorators
- [ ] New public service methods have JSDoc comments
- [ ] Complex hooks/components have JSDoc explaining purpose

### Testing

- [ ] New code has corresponding tests
- [ ] Server unit tests use manual DI (not `Test.createTestingModule`)
- [ ] UI tests are at container level, mocking `axios` not hooks

### Database Changes (if `*.entity.ts` files changed)

- [ ] Migration created if using migration-based workflow (`npm run migration:generate`)
- [ ] Migration file reviewed for correctness (check generated SQL)
- [ ] Migration tested locally (`npm run migration:run`)
- [ ] For dev with `synchronize: true`: confirmed schema syncs correctly on restart

### Documentation (if .md files changed)

- [ ] Paths reference correct locations (`src/ui/containers/`, not `src/ui/<feature>/`)
- [ ] Code examples follow current conventions
- [ ] Cross-referenced docs are consistent

### Shared Components (if `src/ui/shared/components/` changed)

- [ ] Component exported from barrel file (`index.ts`)
- [ ] `architecture/components/shared-ui.md` updated

## Output Format

Provide your review in this format:

### ✅ Approved Items

- [List items that look good]

### ⚠️ Suggestions (Non-Blocking)

- [Optional improvements]

### ❌ Issues (Should Fix Before Push)

- [Critical issues that violate project patterns]

### 📝 Documentation Updates Needed

- [Any docs that need updating based on the changes]
