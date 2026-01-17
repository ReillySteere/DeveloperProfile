# AI Agent Documentation Improvements

This document tracks the ongoing effort to enhance AI agent support in this repository. It serves as a reference for continuing work across sessions.

## Completed Work

### Phase 1: Critical Foundations ✅

**Completed on:** January 17, 2026

| Item                             | Status  | Notes                                                              |
| -------------------------------- | ------- | ------------------------------------------------------------------ |
| 1.1 Add error-handling skill     | ✅ Done | Created `.github/skills/error-handling/SKILL.md`                   |
| 1.2 Add code-review skill        | ✅ Done | Created `.github/skills/code-review/SKILL.md`                      |
| 1.3 Enhance skills with examples | ✅ Done | Updated `testing-workflow`, `architecture-nav`, `feature-scaffold` |

**Key fixes applied during Phase 1:**

- Fixed incorrect paths (e.g., `src/server/auth/` → `src/server/shared/modules/auth/`)
- Added proper imports to code examples
- Clarified hook mocking guidance: mock global state hooks (`useAuth`), don't mock feature hooks
- Updated test import paths to use `ui/test-utils`
- Balanced error-handling skill for both React and NestJS contexts
- Documented unified Jest entrypoint (`jest.config.ts` → `jest.browser.ts` + `jest.node.ts`)

---

### Phase 2: Tool Utilization & Automation ✅

**Completed on:** January 17, 2026

| Item                                  | Status  | Notes                                                   |
| ------------------------------------- | ------- | ------------------------------------------------------- |
| 2.1 Add "Build & Run" Prompt          | ✅ Done | Created `.github/prompts/build-debug.prompt.md`         |
| 2.2 Create "Migration" Skill          | ✅ Done | Created `.github/skills/database-migration/SKILL.md`    |
| 2.3 Integrate VS Code Tasks in Skills | ✅ Done | Updated `testing-workflow` and `dependency-enforcement` |

**Key additions in Phase 2:**

- Build-debug prompt covers: npm scripts, port conflicts, database issues, Docker troubleshooting, environment variables
- Database-migration skill covers: creating, running, reverting migrations, SQLite-specific patterns, troubleshooting
- Skills now reference VS Code task IDs (e.g., `npm: test:server`) for reliable execution
- Added documentation consistency requirement to `copilot-instructions.md` and enhanced `doc-review` skill with cross-reference guidance

---

### Phase 3: Discoverability & Onboarding ✅

**Completed on:** January 17, 2026

| Item                                         | Status  | Notes                                                        |
| -------------------------------------------- | ------- | ------------------------------------------------------------ |
| 3.1 Create Skills Index/README               | ✅ Done | Created `.github/skills/README.md`                           |
| 3.2 Add Onboarding Chat Mode                 | ✅ Done | Created `.github/chatmodes/onboarding.chatmode.md`           |
| 3.3 Document Missing Component Architectures | ✅ Done | Created `architecture/components/auth.md` and `shared-ui.md` |

**Key additions in Phase 3:**

- Skills README with decision tree and categorized skill list
- Onboarding chat mode for new contributors with guided tour topics
- Auth architecture doc covering JWT flow, AuthInterceptor, and token management
- Shared UI architecture doc covering component catalog and import conventions
- Fixed outdated paths in existing architecture docs (`blog.md`, `experience.md`, `projects.md`, `about.md`)

---

## Remaining Work

### Phase 4: Advanced Agent Capabilities

**Effort:** Medium-High | **Impact:** Low-Medium

#### 4.1 Add "Refactoring" Prompt

**File:** `.github/prompts/refactor.prompt.md`

**Content to cover:**

- Extract component pattern
- Extract hook pattern
- Move to shared (types, utils)
- Safe renaming with usages
- Incremental changes principle

#### 4.2 Create "API Design" Skill

**File:** `.github/skills/api-design/SKILL.md`

**Content to cover:**

- RESTful endpoint naming (`/api/<resource>`)
- Required Swagger decorators (`@ApiOperation`, `@ApiResponse`, `@ApiTags`)
- Error response patterns (`NotFoundException`, `UnauthorizedException`)
- Pagination patterns (if applicable)
- Guard usage (`@UseGuards(JwtAuthGuard)`)

#### 4.3 Add Validation Automation Prompt

**File:** `.github/prompts/validate-changes.prompt.md`

**Content:**

```markdown
After making changes, run validation:

1. `npm test` - All tests pass
2. `npm run lint` - No lint errors
3. `npm run type-check` - No type errors
4. `npm run depcruise:verify` - Dependency rules pass
```

---

### Phase 5: Maintenance & Sustainability

**Effort:** Low | **Impact:** Low

#### 5.1 Add Documentation Maintenance Checklist

**Location:** Add to `documentation-standards` skill OR create separate file

**Checklist:**

- [ ] JSDoc on new public methods
- [ ] Swagger decorators on new endpoints
- [ ] ADR for architectural decisions
- [ ] Component doc if complex feature
- [ ] Update README if setup changes

#### 5.2 Version/Changelog for AI Instructions

**File:** `.github/INSTRUCTIONS_CHANGELOG.md`

**Format:**

```markdown
# AI Instructions Changelog

## 2026-01-17

- Added `error-handling` skill
- Added `code-review` skill
- Enhanced existing skills with examples
- Fixed path references across skills
```

---

## Key Patterns & Conventions Discovered

### Skill File Format

```markdown
---
name: skill-name
description: Brief description for skill selection.
---

# Skill Title

Use this skill when...

## 1. Section

### Subsection

#### Example: Descriptive Name
```

### Path Conventions

| Layer                | Path Pattern                      |
| -------------------- | --------------------------------- |
| Server modules       | `src/server/modules/<feature>/`   |
| Server shared (auth) | `src/server/shared/modules/auth/` |
| UI containers        | `src/ui/containers/<feature>/`    |
| UI shared            | `src/ui/shared/`                  |
| Shared types         | `src/shared/types/<feature>.ts`   |

### Test File Patterns

| Type               | Pattern                 | Config            |
| ------------------ | ----------------------- | ----------------- |
| Server integration | `*.integration.test.ts` | `jest.node.ts`    |
| Server unit        | `*.test.ts`             | `jest.node.ts`    |
| UI integration     | `*.test.tsx`            | `jest.browser.ts` |

### Import Conventions

- UI test utils: `import { render } from 'ui/test-utils';`
- Shared types: `import { Type } from 'shared/types/<feature>';`
- Server path alias: `import { X } from 'server/<path>';`

---

## Gotchas & Lessons Learned

1. **Markdown fence wrapping:** When creating skill files, don't wrap the entire content in ` ```markdown ` fences - just use frontmatter.

2. **Hook mocking nuance:** Mock global state hooks (`useAuth`), but let feature hooks (`useBlog`) execute and mock `axios` instead.

3. **Auth location:** Auth is in `src/server/shared/modules/auth/`, NOT `src/server/auth/`.

4. **Test imports:** Always use `ui/test-utils`, not just `test-utils`.

5. **Jest unified config:** The project uses `jest.config.ts` as a unified entrypoint that delegates to `jest.browser.ts` and `jest.node.ts`.

---

## Contribution Priority Order

| Priority | Item                                 | Effort | Impact | Status  |
| -------- | ------------------------------------ | ------ | ------ | ------- |
| 1        | Skills README/index                  | Low    | Medium | Phase 3 |
| 2        | Document auth/shared-ui architecture | Low    | Medium | Phase 3 |
| 3        | Create build-debug prompt            | Medium | Medium | ✅ Done |
| 4        | Create database-migration skill      | Medium | Medium | ✅ Done |
| 5        | Update skills to use VS Code tasks   | Low    | Low    | ✅ Done |
| 6        | Add onboarding chat mode             | Medium | Medium | Phase 3 |
| 7        | Add refactoring prompt               | Medium | Low    | Phase 4 |
| 8        | Add API design skill                 | Medium | Low    | Phase 4 |
| 9        | Add validation prompt                | Low    | Low    | Phase 4 |
| 10       | Add instructions changelog           | Low    | Low    | Phase 5 |
