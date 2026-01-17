---
description: Create a feature branch, push to GitHub, and generate a PR description for manual creation.
---

# Create Pull Request

You are a release engineer helping prepare code for review. Create a feature branch, push it to GitHub, and generate a structured PR description that can be used when creating the PR via the GitHub web interface.

## Instructions

1. **Analyze changes**: Examine the current git diff (staged, unstaged, or last commit)
2. **Create branch**: Generate a descriptive branch name from the changes
3. **Commit if needed**: If there are uncommitted changes, commit them with a meaningful message
4. **Push to GitHub**: Push the branch to origin
5. **Generate PR description**: Create a structured PR body following the template below
6. **Provide PR link**: Output the GitHub URL where the user can create the PR

## Branch Naming Convention

Use the format: `<type>/<short-description>`

Types:

- `feature/` - New functionality
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks

Examples:

- `feature/add-comments-module`
- `fix/auth-token-expiry`
- `docs/update-ai-agent-skills`

## Workflow Commands

Execute these commands in sequence:

```bash
# 1. Create and switch to feature branch
git checkout -b <branch-name>

# 2. Stage and commit (if uncommitted changes exist)
git add -A
git commit -m "<commit-message>"

# 3. Push to origin
git push -u origin <branch-name>
```

After pushing, provide the user with:

1. **PR Creation URL**: `https://github.com/<owner>/<repo>/compare/main...<branch-name>?expand=1`
2. **Suggested PR Title**: Based on the changes
3. **PR Description**: Ready to copy-paste (see template below)

## PR Description Template

Generate a PR description following this structure:

```markdown
## Summary

[2-3 sentence description of what this PR accomplishes and why]

## Changes

### Areas Modified

- [ ] Backend (`src/server/`)
- [ ] Frontend (`src/ui/`)
- [ ] Shared Types (`src/shared/`)
- [ ] Documentation (`.github/`, `architecture/`)
- [ ] Configuration (package.json, tsconfig, etc.)
- [ ] Database (entities, migrations)

### Files Changed

[List the key files/modules affected, grouped by area]

## Manual Testing Checklist

[If manual testing is needed, list specific scenarios. If not, explain why.]

### Scenarios to Test

- [ ] [Scenario 1: Description]
- [ ] [Scenario 2: Description]

**OR**

> ✅ No manual testing required - [Reason, e.g., "Documentation-only changes" or "Covered by automated tests"]

## Automated Checks

Before merging, ensure:

- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm run depcruise:verify` passes
```

## Final Output Format

After executing the git commands, provide:

```
✅ Branch created and pushed!

**Branch:** `<branch-name>`

**Create PR here:** https://github.com/<owner>/<repo>/compare/main...<branch-name>?expand=1

---

**Suggested PR Title:**
<title>

**PR Description (copy this):**

<full PR description markdown>
```

## Decision Logic for Manual Testing

| Change Type            | Manual Testing Needed? | Reason                      |
| ---------------------- | ---------------------- | --------------------------- |
| Documentation only     | ❌ No                  | No runtime behavior         |
| Config files only      | ⚠️ Maybe               | Depends on impact           |
| Backend API changes    | ✅ Yes                 | Test endpoints manually     |
| Frontend UI changes    | ✅ Yes                 | Visual verification needed  |
| Database schema        | ✅ Yes                 | Data integrity verification |
| Refactoring with tests | ❌ No                  | Covered by test suite       |
| New feature            | ✅ Yes                 | End-to-end verification     |
