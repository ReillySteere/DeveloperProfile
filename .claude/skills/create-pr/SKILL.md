---
description: Create a feature branch, push to GitHub, and create a Pull Request using GitHub CLI.
---

# Create Pull Request

You are a release engineer helping prepare code for review. Create a feature branch, push it to GitHub, and create a Pull Request directly using the GitHub CLI (`gh`).

## Instructions

1. **Analyze changes**: Examine the current git diff (staged, unstaged, or last commit)
2. **Create branch**: Generate a descriptive branch name from the changes
3. **Commit if needed**: If there are uncommitted changes, commit them with a meaningful message
4. **Push to GitHub**: Push the branch to origin
5. **Create PR**: Use `gh pr create` to create the PR with title and body
6. **Confirm**: Output the PR URL to the user

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

# 4. Create PR using GitHub CLI
gh pr create --title "<pr-title>" --body "<pr-body-markdown>"
```

The `gh pr create` command will output the PR URL upon success.

## Shell Escaping Rules

When passing the PR body to `gh pr create --body`, follow these rules:

### Newlines

- **DO NOT** use `\n` for newlines - this renders as literal `\n` in GitHub
- Use actual line breaks within the quoted string
- PowerShell and bash both support multi-line strings in double quotes

### File Paths

- **DO NOT** use leading slashes (e.g., `/src/server/`)
- **DO** use relative paths without leading slash (e.g., `src/server/`)
- Paths should match the repository structure exactly

### Backticks

- **PowerShell:** Double the backticks: ` `` ` becomes `` ` `` (backtick is PowerShell's escape char)
- **Bash:** Use backslash: `` \` `` becomes `` ` ``
- This applies to inline code references like `` `src/server/app.module.ts` ``

### Example (Correct - PowerShell)

```powershell
gh pr create --title "feat: add feature" --body "## Summary

This PR adds a new feature.

## Changes

- ``src/server/app.module.ts`` - Updated config"
```

### Example (Correct - Bash)

```bash
gh pr create --title "feat: add feature" --body "## Summary

This PR adds a new feature.

## Changes

- \`src/server/app.module.ts\` - Updated config"
```

## PR Body Template

Generate a PR body following this structure (as a single markdown string for the `--body` parameter):

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

### Key Files Changed

[List the key files/modules affected, grouped by area - be concise]

## Testing

### Manual Testing Checklist

[If manual testing is needed, list specific scenarios. If not, explain why.]

- [ ] [Scenario 1: Description]
- [ ] [Scenario 2: Description]

**OR**

> ✅ No manual testing required - [Reason]

### Automated Checks

- [x] npm test passes
- [x] npm run lint passes
- [x] npm run type-check passes
- [x] npm run depcruise:verify passes
```

## Final Output Format

After executing all commands including `gh pr create`, provide:

```
✅ Pull Request created!

**Branch:** `<branch-name>`
**PR:** <pr-url-from-gh-output>
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
