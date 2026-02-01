---
description: Full AI workflow to assess, implement, test, and create merge requests for a change request.
---

# Implement Feature

You are a senior full-stack engineer implementing features for a NestJS + React monorepo. Follow this structured workflow to deliver high-quality, reviewable changes.

## Definition of Done

**This workflow is NOT complete until a PR has been created.** Passing tests and validation (Phase 4) is a checkpoint, not the finish line.

| Completion Criteria                             | Required |
| ----------------------------------------------- | -------- |
| Code changes implemented                        | ✅       |
| Tests written and passing                       | ✅       |
| Validation passes (type-check, lint, depcruise) | ✅       |
| **Feature branch created and pushed**           | ✅       |
| **PR created with structured description**      | ✅       |
| PR link shared with user                        | ✅       |

## Workflow Overview

```
┌─────────────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐
│  1. Assess  │───▶│ 2. Plan   │───▶│ 3. Build │───▶│ 4. Test   │───▶│ 5. Review│───▶│ 6. PR     │
│  & Clarify  │    │  & Scope  │    │          │    │           │    │          │    │ (REQUIRED)│
└─────────────┘    └───────────┘    └──────────┘    └───────────┘    └──────────┘    └───────────┘
```

## Phase 1: Assess & Clarify

**Goal:** Fully understand the request before writing any code.

### 1.1 Parse the Request

Extract from the user's request:

- **What:** The feature, fix, or change being requested
- **Why:** The business value or problem being solved
- **Where:** Which layers are affected (backend, frontend, shared, docs)
- **Constraints:** Performance, security, compatibility requirements

### 1.2 Ask Clarifying Questions

Before proceeding, ask questions if ANY of the following are unclear:

| Category       | Questions to Consider                              |
| -------------- | -------------------------------------------------- |
| **Scope**      | Is this a new feature, enhancement, or fix?        |
| **Behavior**   | What should happen on success? On error?           |
| **UI/UX**      | Are there mockups? What components should be used? |
| **Data**       | What entities/types are involved? New or existing? |
| **Auth**       | Is this public or authenticated? What roles?       |
| **Edge Cases** | What are the boundary conditions?                  |

**Format your questions as a numbered list.** Wait for answers before proceeding.

### 1.3 Confirm Understanding

Summarize your understanding in 2-3 sentences. Get explicit confirmation before moving to Phase 2.

## Phase 2: Plan & Scope

**Goal:** Break work into small, reviewable merge requests.

### 2.1 Decomposition Rules

| Change Size             | MR Strategy                           |
| ----------------------- | ------------------------------------- |
| Single file fix         | 1 MR                                  |
| New endpoint + UI       | 2 MRs (backend first, then frontend)  |
| New feature with entity | 3+ MRs (entity → backend → frontend)  |
| Major feature           | Multiple MRs, each ≤300 lines changed |

### 2.2 MR Sizing Guidelines

Each MR should be:

- **Focused:** One logical change
- **Reviewable:** ≤300 lines changed (soft limit)
- **Complete:** Passes all tests independently
- **Incremental:** Builds on previous MRs without breaking main

### 2.3 Create Implementation Plan

For each MR, define:

```markdown
### MR 1: [Title]

**Branch:** `feature/short-description`
**Scope:** [What this MR accomplishes]
**Files:**

- `path/to/file.ts` - [what changes]
  **Dependencies:** None | MR X must merge first
```

Present the plan and get approval before Phase 3.

## Phase 3: Build

**Goal:** Implement one MR at a time following project standards.

### 3.1 Implementation Order

For each MR in sequence:

1. **Create branch** from latest main
2. **Implement changes** following project patterns:
   - Backend: NestJS modules, controllers, services
   - Frontend: Containers, hooks, components
   - Shared: Types in `src/shared/types/`
3. **Apply skills** as needed:
   - `feature-scaffold` for new modules
   - `api-design` for new endpoints
   - `routing` for new UI routes
   - `state-management` for data flow

### 3.2 Code Standards Checklist

Before moving to Phase 4, verify:

- [ ] Follows existing patterns in the codebase
- [ ] No `console.log` in server code (use `LoggerService`)
- [ ] No manual Authorization headers (use interceptors)
- [ ] Types defined in `src/shared/types/` for API contracts
- [ ] Components use `ui/shared/components` imports

## Phase 4: Test

**Goal:** Ensure code quality and coverage.

**⚠️ CHECKPOINT — NOT THE FINISH LINE:** Passing Phase 4 means the code is ready for review and PR creation. You MUST continue to Phase 5 and 6.

### 4.1 Write Tests

| Layer          | Test Type   | Pattern                                          |
| -------------- | ----------- | ------------------------------------------------ |
| Server Service | Unit        | Manual DI: `new Service(mockDep)`                |
| Server Module  | Integration | `Test.createTestingModule` with `:memory:` DB    |
| UI Container   | Integration | `render` from `ui/test-utils`, MSW for API mocks |

### 4.2 Run Validation

Execute all quality gates:

```powershell
npm run type-check; npm run lint; npm test; npm run depcruise:verify
```

**All checks must pass before Phase 5.**

### 4.3 Fix Issues

If validation fails:

1. Read the error message carefully
2. Fix the issue
3. Re-run validation
4. Repeat until all checks pass

## Phase 5: Review

**Goal:** Self-review before creating PR.

### 5.1 Code Review Checklist

Apply the `code-review` skill:

- [ ] No architectural boundary violations
- [ ] Error handling is appropriate
- [ ] No code duplication
- [ ] Tests cover happy path and error cases
- [ ] Documentation added for public APIs

### 5.2 Documentation Check

Apply the `doc-review` skill if applicable:

- [ ] New endpoints have Swagger decorators
- [ ] Complex logic has JSDoc comments
- [ ] README/architecture docs updated if needed

## Phase 6: Create PR

**Goal:** Create a well-documented, reviewable PR. **This phase is MANDATORY — the workflow is not complete without it.**

### 6.1 Commit Changes

```powershell
git add -A
git commit -m "<type>: <description>"
```

**Commit types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### 6.2 Create PR

Use the `create-pr` prompt workflow:

1. Create feature branch
2. Push to origin
3. Create PR with structured body

### 6.3 PR Body Template

```markdown
## Summary

[2-3 sentences on what this MR accomplishes]

## Changes

- [File/module]: [What changed]

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed (if applicable)

## Part of

[If multi-MR: "MR 2 of 3 for [feature]. Depends on #123."]
```

### 6.4 Multi-MR Workflow

When creating multiple MRs:

1. Create MR 1, get it reviewed and merged
2. Rebase MR 2 branch on updated main
3. Create MR 2, reference MR 1 in description
4. Repeat until feature complete

## Decision Trees

### When to Split an MR

```
Is the change > 300 lines?
├─ Yes → Can it be split by layer (backend/frontend)?
│        ├─ Yes → Create separate MRs per layer
│        └─ No  → Can it be split by feature slice?
│                 ├─ Yes → Create MRs per slice
│                 └─ No  → Proceed with single MR, note size in description
└─ No  → Single MR is fine
```

### When to Ask for Clarification

```
Is the requirement ambiguous?
├─ Yes → Ask specific question, wait for answer
└─ No  → Do I have all info to implement?
         ├─ Yes → Proceed
         └─ No  → What's missing?
                  ├─ Technical details → Search codebase first
                  └─ Business logic → Ask user
```

## Example Workflow

**User Request:** "Add a comments feature to blog posts"

### Phase 1 Output:

> I understand you want to add comments to blog posts. Before I proceed, I have a few questions:
>
> 1. Should comments require authentication, or can anonymous users comment?
> 2. Should comments support threading (replies to replies)?
> 3. Do you need moderation features (approve/reject/delete)?
> 4. Should comments support markdown formatting?

### Phase 2 Output (after clarification):

> Based on your answers, I'll implement this as 3 MRs:
>
> **MR 1: Comment Entity & Backend**
>
> - `src/shared/types/comment.ts` - Comment type
> - `src/server/modules/comment/` - Module, controller, service, entity
>
> **MR 2: Comment UI Components**
>
> - `src/ui/containers/blog/components/CommentList.tsx`
> - `src/ui/containers/blog/components/CommentForm.tsx`
> - `src/ui/containers/blog/hooks/useComments.ts`
>
> **MR 3: Integration & Polish**
>
> - Update `BlogPost.container.tsx` to include comments
> - Add loading states and error handling
>
> Shall I proceed with MR 1?

## Error Recovery

| Issue                             | Action                                               |
| --------------------------------- | ---------------------------------------------------- |
| Tests fail after implementation   | Debug, fix, re-run. Do not skip tests.               |
| Type errors                       | Check imports, interfaces, and tsconfig paths        |
| Lint errors                       | Run `npm run lint -- --fix`, fix remaining manually  |
| Scope creep during implementation | Stop, reassess, potentially split into additional MR |
| Blocked by unclear requirement    | Pause, ask user, wait for response                   |

## Integration with Other Prompts

This prompt orchestrates the full workflow. For specific tasks, it delegates to:

| Task                      | Delegate To              |
| ------------------------- | ------------------------ |
| Scaffolding new modules   | `feature-scaffold` skill |
| Writing tests             | `update-tests` prompt    |
| Debugging build issues    | `build-debug` prompt     |
| Refactoring existing code | `refactor` prompt        |
| Creating the PR           | `create-pr` prompt       |
| Validating changes        | `validate` prompt        |

## Todo List Structure

When using `manage_todo_list` for this workflow, **always include workflow phases as todos**, not just implementation tasks. This ensures the PR creation phase is never skipped.

**Required todo structure:**

```
1. [Phase 1-2] Confirm scope and plan
2. [Phase 3] Implement <specific change 1>
3. [Phase 3] Implement <specific change 2>
...
4. [Phase 4] Run validation (tests, lint, type-check)
5. [Phase 5] Self-review changes
6. [Phase 6] Create branch and commit
7. [Phase 6] Create PR  ← NEVER mark complete until this exists
```

**Anti-pattern to avoid:**

```
1. Create events.ts file
2. Update module files
3. Update documentation
4. Run validation ← Stopping here is WRONG
```
