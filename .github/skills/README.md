# Skills Index

This directory contains skills that provide domain-specific knowledge to AI agents working in this repository.

## Pre-Push Review Workflow

Before pushing changes, run an AI code review using your project's conventions:

1. **Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. **Run:** `Chat: Use Prompt from File`
3. **Select:** `pre-push-review`
4. **Review** the AI's findings and address any issues

This leverages the `code-review` and `doc-review` skills automatically.

### Full Documentation Audit

For comprehensive documentation verification (recommended before major releases):

```
/pre-push-review --full-doc-audit
```

Or run standalone:

```
/doc-audit
```

This verifies ALL AI agent documentation matches the current codebase structure.

## Quick Reference: Which Skill Do I Need?

| I want to...                         | Use this skill            |
| ------------------------------------ | ------------------------- |
| Find code in the codebase            | `architecture-nav`        |
| Create a new feature (full stack)    | `feature-scaffold`        |
| Design a new API endpoint            | `api-design`              |
| Write or debug tests                 | `testing-workflow`        |
| Fix TypeScript, Jest, or lint errors | `error-handling`          |
| Step-through debug runtime issues    | `debugging`               |
| Review code changes                  | `code-review`             |
| Check dependency boundaries          | `dependency-enforcement`  |
| Create or run database migrations    | `database-migration`      |
| Write code documentation             | `documentation-standards` |
| Review docs after code changes       | `doc-review`              |
| Implement secure coding practices    | `security`                |
| Manage state (Zustand/Query)         | `state-management`        |
| Add routes or navigation             | `routing`                 |

## Decision Tree

```
Start
  │
  ├─ Need to understand the codebase?
  │    └─ architecture-nav
  │
  ├─ Building something new?
  │    ├─ Full feature (UI + API)? → feature-scaffold
  │    ├─ New API endpoint? → api-design
  │    ├─ Adding routes? → routing
  │    └─ Database schema change? → database-migration
  │
  ├─ Something broken?
  │    ├─ Test failing? → testing-workflow
  │    ├─ TypeScript/ESLint error? → error-handling
  │    ├─ Runtime bug (step-through)? → debugging
  │    └─ Dependency rule violation? → dependency-enforcement
  │
  ├─ Working with state or data?
  │    ├─ Server data (API)? → state-management
  │    ├─ Global UI state? → state-management
  │    └─ URL/route params? → routing
  │
  ├─ Security or auth concerns?
  │    └─ security
  │
  ├─ Reviewing or documenting?
  │    ├─ Code review? → code-review
  │    ├─ Writing docs? → documentation-standards
  │    └─ Checking if docs need updates? → doc-review
  │
  └─ None of the above? → Check copilot-instructions.md
```

## Skills by Category

### 🏗️ Development

| Skill                | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `feature-scaffold`   | Generate boilerplate for new full-stack features  |
| `architecture-nav`   | Navigate and understand the codebase structure    |
| `database-migration` | Create and manage TypeORM migrations              |
| `routing`            | TanStack Router file-based routing and navigation |

### ✅ Quality Assurance

| Skill                    | Purpose                                  |
| ------------------------ | ---------------------------------------- |
| `testing-workflow`       | Write and debug Jest tests (server + UI) |
| `code-review`            | Review code for quality and patterns     |
| `error-handling`         | Debug TypeScript, Jest, ESLint errors    |
| `debugging`              | Step-through debugging with VS Code      |
| `dependency-enforcement` | Validate modular monolith boundaries     |

### 🔐 Security

| Skill      | Purpose                                              |
| ---------- | ---------------------------------------------------- |
| `security` | Auth, input validation, and vulnerability prevention |

### 📊 State & Data

| Skill              | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `state-management` | Zustand (global) and TanStack Query (server) |

### 📝 Documentation

| Skill                     | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| `documentation-standards` | Guidelines for code comments, ADRs, APIs |
| `doc-review`              | Check if docs need updates after changes |

### 🔧 API Development

| Skill        | Purpose                                              |
| ------------ | ---------------------------------------------------- |
| `api-design` | Design RESTful endpoints with Swagger and validation |

## Skill File Structure

Each skill follows this format:

```markdown
---
name: skill-name
description: Brief description shown in skill picker.
---

# Skill Title

Use this skill when...

## 1. First Section

...
```

## Adding New Skills

1. Create a new folder: `.github/skills/<skill-name>/`
2. Add `SKILL.md` with the frontmatter format above
3. The skill will be auto-discovered by VS Code

## Related Resources

- [copilot-instructions.md](../copilot-instructions.md) - Main AI agent instructions
- [prompts/](../prompts/) - Task-specific prompts
- [chatmodes/](../chatmodes/) - Specialized conversation modes
