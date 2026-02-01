---
description: Run validation checks and review code before committing or pushing changes.
---

# Validate Changes

Run this validation workflow after making changes to ensure all quality gates pass.

## Quick Validation

Run all checks in sequence:

```powershell
npm run type-check; npm run lint; npm test; npm run depcruise:verify
```

## Validation Steps

### 1. Type Check

Verify TypeScript compiles without errors:

```bash
npm run type-check
```

**Common fixes:**

- Add missing type annotations
- Fix import paths (check `tsconfig.json` aliases)
- Update interfaces for changed properties

### 2. Lint

Check code style and catch common issues:

```bash
npm run lint
```

**Auto-fix most issues:**

```bash
npm run lint -- --fix
```

### 3. Format

Verify code formatting matches Prettier config:

```bash
npm run check-format
```

**Auto-fix formatting:**

```bash
npm run format
```

### 4. Tests

Run all tests with coverage:

```bash
npm test
```

**Run specific test suites:**

```bash
# UI tests only
npm run test:ui

# Server tests only
npm run test:server

# Single file
npx jest path/to/file.test.ts --config jest.browser.ts
```

**Coverage requirement:** 100% for statements, branches, functions, and lines.

### 5. Dependency Verification

Check architectural boundaries:

```bash
npm run depcruise:verify
```

**Common violations:**

- UI importing from server → Move type to `src/shared/types/`
- Server importing from UI → Should never happen
- Cross-feature imports → Use shared or extract common code

## Pre-Commit Checklist

| Check  | Command                    | Expected                |
| ------ | -------------------------- | ----------------------- |
| Types  | `npm run type-check`       | No errors               |
| Lint   | `npm run lint`             | No errors/warnings      |
| Format | `npm run check-format`     | All files formatted     |
| Tests  | `npm test`                 | All pass, 100% coverage |
| Deps   | `npm run depcruise:verify` | No violations           |

## Code Review Checklist

When reviewing your own changes before pushing, verify:

### Architecture & Boundaries

- [ ] No imports from `src/ui` → `src/server` or vice versa
- [ ] New features follow vertical slice pattern
- [ ] Shared types are in `src/shared/types/`

### Code Quality

- [ ] SOLID principles followed
- [ ] No code duplication that should be extracted
- [ ] Error handling is appropriate
- [ ] No `console.log` in server code

### Testing

- [ ] New code has corresponding tests
- [ ] Server unit tests use manual DI
- [ ] UI tests are at container level with MSW mocks

### Documentation

- [ ] New endpoints have Swagger decorators
- [ ] Public methods have JSDoc comments
- [ ] Architecture docs updated if needed

### Database Changes (if `*.entity.ts` modified)

- [ ] Migration created if needed
- [ ] Migration tested locally
- [ ] Schema syncs correctly on restart

## Troubleshooting

### Type Check Failures

1. Read the error - focus on the **first** error
2. Check if it's your code or a dependency type issue
3. Verify import paths match `tsconfig.json` aliases
4. See `error-handling` skill for common fixes

### Test Failures

1. Run the failing test in isolation with `--verbose`
2. Check mock setup is correct
3. Look for async issues (missing `await`, `waitFor`)
4. See `testing-workflow` skill for debugging

### Lint Failures

1. Try `npm run lint -- --fix` first
2. For remaining issues, fix manually
3. Don't disable rules without justification

### Dependency Violations

1. Identify the forbidden import path
2. Move shared types to `src/shared/types/`
3. Extract common utilities appropriately

## Full Documentation Audit

For comprehensive documentation verification, use the `doc-audit` prompt:

```
/doc-audit
```

This audits all AI documentation against the current codebase state.
