---
description: Run all validation checks after making code changes to ensure quality gates pass.
---

# Validate Changes

Run this validation workflow after making changes to ensure all quality gates pass before committing.

## Quick Validation

Run all checks in sequence:

```powershell
npm run type-check; npm run lint; npm test; npm run depcruise:verify
```

Or use VS Code tasks for individual checks.

## Validation Steps

### 1. Type Check

Verify TypeScript compiles without errors:

```bash
npm run type-check
```

**VS Code Task:** `npm: type-check`

**Common fixes:**

- Add missing type annotations
- Fix import paths (check `tsconfig.json` aliases)
- Update interfaces for changed properties

### 2. Lint

Check code style and catch common issues:

```bash
npm run lint
```

**VS Code Task:** `npm: lint`

**Auto-fix most issues:**

```bash
npm run lint -- --fix
```

**Common issues:**

- Unused imports → Remove them
- Missing dependencies in hooks → Add to dependency array
- Console statements → Remove or convert to logger

### 3. Format Check

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

**VS Code Tasks:**

- `npm: test:all` - All tests
- `npm: test:server` - Server only
- `npm: test:ui` - UI only

**Run single test file:**

```bash
# UI test
npx jest src/ui/containers/blog/blog.container.test.tsx --config jest.browser.ts

# Server test
npx jest src/server/modules/blog/blog.integration.test.ts --config jest.node.ts
```

**Coverage requirement:** 100% for statements, branches, functions, and lines.

### 5. Dependency Verification

Check architectural boundaries:

```bash
npm run depcruise:verify
```

**VS Code Task:** `shell: depcruise verify`

**Common violations:**

- UI importing from server → Move type to `src/shared/types/`
- Server importing from UI → Should never happen
- Cross-feature imports → Use shared or extract common code

## Pre-Commit Checklist

Before committing, verify:

| Check  | Command                    | Expected                         |
| ------ | -------------------------- | -------------------------------- |
| Types  | `npm run type-check`       | No errors                        |
| Lint   | `npm run lint`             | No errors/warnings               |
| Format | `npm run check-format`     | "All matched files use Prettier" |
| Tests  | `npm test`                 | All pass, 100% coverage          |
| Deps   | `npm run depcruise:verify` | No violations                    |

## Pre-Push Validation

The Husky pre-push hook automatically runs:

1. `npm test`
2. `npm run lint`
3. `npm run check-format`
4. `npm run depcruise:verify`

If any check fails, the push is blocked.

**Bypass (not recommended):**

```bash
git push --no-verify
```

## Troubleshooting Failed Checks

### Type Check Failures

1. Read the error message - focus on the **first** error
2. Check if it's in your code or a dependency type
3. Verify import paths match `tsconfig.json` aliases
4. See `error-handling` skill for common TypeScript errors

### Test Failures

1. Run the failing test in isolation with `--verbose`
2. Check if mocks are set up correctly
3. Look for async issues (missing `await`, `waitFor`)
4. See `testing-workflow` skill for debugging

### Lint Failures

1. Try `npm run lint -- --fix` first
2. For remaining issues, read the rule name and fix manually
3. Don't disable rules without good reason

### Dependency Violations

1. Identify the forbidden import
2. Check the `doc-review` skill for proper layering
3. Usually means moving a type to `src/shared/types/`

## Integration with AI Workflow

After validation passes, use:

- `/pre-push-review` - AI code review before pushing
- `/create-pr` - Generate PR description
