---
description: Comprehensive audit of all AI agent documentation and copilot instructions against current repo state.
---

# Documentation Audit

You are a documentation auditor for this project. Perform a comprehensive review of ALL AI agent documentation to ensure it accurately reflects the current state of the codebase.

## Purpose

This audit verifies that:

- All file paths in documentation match actual project structure
- Code examples follow current patterns and conventions
- Referenced files, skills, and prompts actually exist
- Cross-references between documents are consistent
- No outdated patterns or deprecated approaches are documented

## Audit Scope

### Primary Documents to Audit

1. **Copilot Instructions**: `.github/copilot-instructions.md`
2. **Skills**: All files in `.github/skills/*/SKILL.md`
3. **Prompts**: All files in `.github/prompts/*.prompt.md`
4. **Chat Modes**: All files in `.github/chatmodes/*.chatmode.md`
5. **Architecture Docs**: All files in `architecture/components/*.md` and `architecture/decisions/*.md`
6. **Contributing Guide**: `CONTRIBUTING.md`
7. **README**: `README.md`

### Verification Points

For each document, verify:

| Check                      | How to Verify                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------- |
| **File paths exist**       | Run `Test-Path` or `ls` on referenced paths                                             |
| **Import statements work** | Check that import examples match actual module structure                                |
| **Example files exist**    | Verify files like `sentry-exception.filter.test.ts` still exist at documented locations |
| **Pattern accuracy**       | Compare documented patterns against actual implementation                               |
| **Cross-references valid** | Ensure referenced skills/prompts/docs exist                                             |

## Audit Procedure

### Step 1: Collect Current State

Run these commands to understand the actual project structure:

```powershell
# UI structure
Get-ChildItem -Path "src/ui" -Directory -Recurse -Depth 2 | Select-Object FullName

# Server structure
Get-ChildItem -Path "src/server" -Directory -Recurse -Depth 2 | Select-Object FullName

# Skills and prompts
Get-ChildItem -Path ".github/skills" -Directory | Select-Object Name
Get-ChildItem -Path ".github/prompts" -File | Select-Object Name

# Shared components
Get-ChildItem -Path "src/ui/shared/components" -Directory | Select-Object Name
```

### Step 2: Audit Each Document

Apply the `doc-review` skill's consistency checks to each document:

**Path Patterns to Verify:**

| Pattern        | Correct Value                                          |
| -------------- | ------------------------------------------------------ |
| Auth module    | `src/server/shared/modules/auth/`                      |
| UI features    | `src/ui/containers/<feature>/`                         |
| Server modules | `src/server/modules/<feature>/`                        |
| Shared types   | `src/shared/types/`                                    |
| Shared UI      | `src/ui/shared/components/`                            |
| Test utils     | `src/ui/test-utils/` or `ui/test-utils` (import alias) |

**Code Pattern Verification:**

| Pattern           | Verify Against                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Unit test DI      | Check `src/server/sentry-exception.filter.test.ts` for manual DI                                    |
| Integration test  | Check `src/server/modules/experience/experience.integration.test.ts` for `Test.createTestingModule` |
| UI container test | Check `src/ui/containers/experience/experience.container.test.tsx` for `render` from test-utils     |
| Hook pattern      | Check any `src/ui/containers/*/hooks/use*.ts` for TanStack Query usage                              |

### Step 3: Cross-Reference Check

Verify these relationships:

1. **copilot-instructions.md → Skills**
   - Every skill listed in `<skills>` section exists in `.github/skills/`
   - Skill descriptions match actual `SKILL.md` content
   - File paths in skill definitions are correct

2. **Skills → Skills**
   - Skills that reference other skills (e.g., "Apply the `testing-workflow` skill") point to existing skills

3. **Prompts → Skills**
   - Prompts that reference skills (e.g., "Apply the `code-review` skill") point to existing skills

4. **Architecture Docs → Code**
   - File paths in architecture docs match actual structure
   - Component lists match actual implementations

5. **CONTRIBUTING.md → Project**
   - Extension recommendations match `.vscode/extensions.json`
   - npm scripts mentioned exist in `package.json`
   - Folder structure descriptions match reality

### Step 4: Component Inventory

For shared UI components, verify:

```powershell
# List all shared components
Get-ChildItem "src/ui/shared/components" -Directory | ForEach-Object { $_.Name }

# Check barrel exports
Get-Content "src/ui/shared/components/index.ts"
```

Compare against `architecture/components/shared-ui.md` to ensure all components are documented.

## Output Format

### Summary

| Category             | Files Audited | Issues Found |
| -------------------- | ------------- | ------------ |
| Copilot Instructions | 1             | X            |
| Skills               | X             | X            |
| Prompts              | X             | X            |
| Architecture         | X             | X            |
| Other                | X             | X            |

### ✅ Verified Correct

- [List documents that passed all checks]

### ⚠️ Minor Issues (Non-Critical)

For each issue:

```
**File:** [path]
**Issue:** [description]
**Current:** [what it says]
**Should Be:** [what it should say]
**Fix:** [specific edit needed]
```

### ❌ Critical Issues (Must Fix)

For each issue:

```
**File:** [path]
**Issue:** [description]
**Impact:** [why this matters]
**Current:** [what it says]
**Should Be:** [what it should say]
**Fix:** [specific edit needed]
```

### 📝 Missing Documentation

- [List any undocumented components, features, or patterns discovered during audit]

## Integration with Pre-Push Review

When invoked as part of `pre-push-review`:

1. **Full Audit Mode** (default for this prompt): Review ALL documentation regardless of what files changed
2. **Incremental Mode** (pre-push-review behavior): Only review docs related to changed files

To trigger a full documentation audit before pushing:

```
@workspace /doc-audit
```

Or combine with pre-push review:

```
@workspace /pre-push-review --full-doc-audit
```
