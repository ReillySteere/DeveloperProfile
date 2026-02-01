# ADR-014: AI Tooling Architecture

## Status

Accepted - February 1, 2026

## Context

This project is designed to be AI-agent friendly, enabling tools like GitHub Copilot and Claude Code
to assist with development tasks. As AI-assisted development becomes more prevalent, we need a
structured approach to providing context and guidance to AI agents.

### Key Challenges

1. **Context fragmentation**: AI agents need comprehensive context about patterns, conventions, and
   architectural decisions to generate consistent code
2. **Tool diversity**: Different AI tools (Copilot, Claude Code) have different instruction formats
3. **Documentation drift**: AI instructions can become outdated as the codebase evolves
4. **Discoverability**: Developers need to know which guidance exists for specific tasks

### Options Considered

| Approach                      | Pros                              | Cons                                  |
| ----------------------------- | --------------------------------- | ------------------------------------- |
| Single instruction file       | Simple, one place to look         | Becomes unwieldy, hard to navigate    |
| Skill-based modular system    | Focused, discoverable, extensible | More files to maintain                |
| Inline code comments only     | Close to code, always in context  | Scattered, hard to find comprehensive |
| External documentation portal | Rich formatting, searchable       | Disconnected from codebase            |

## Decision

Adopt a **multi-layered AI instruction architecture** with specialized artifacts for different
purposes:

### 1. Instruction Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Core Instructions                             │
│  CLAUDE.md + copilot-instructions.md                            │
│  (Architecture overview, critical workflows, key patterns)       │
├─────────────────────────────────────────────────────────────────┤
│                         Skills                                   │
│  .github/skills/<skill-name>/SKILL.md                           │
│  (Domain-specific guidance: testing, migrations, API design)     │
├─────────────────────────────────────────────────────────────────┤
│                         Prompts                                  │
│  .github/prompts/<task>.prompt.md                               │
│  (Reusable task workflows: implement, validate, create-pr)       │
├─────────────────────────────────────────────────────────────────┤
│                       Chat Modes                                 │
│  .github/chatmodes/<mode>.chatmode.md                           │
│  (Specialized personas: onboarding, planning)                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2. File Purposes

| Artifact Type | Location                          | Purpose                        | When to Use              |
| ------------- | --------------------------------- | ------------------------------ | ------------------------ |
| Core          | `CLAUDE.md`                       | Claude Code CLI instructions   | Always loaded            |
| Core          | `.github/copilot-instructions.md` | VS Code Copilot instructions   | Always loaded            |
| Skills        | `.github/skills/*/SKILL.md`       | Domain-specific guidance       | On-demand, task-specific |
| Prompts       | `.github/prompts/*.prompt.md`     | Complete task workflows        | User-invoked via slash   |
| Chat Modes    | `.github/chatmodes/*.chatmode.md` | Specialized conversation modes | Mode-specific sessions   |

### 3. Skill Design Principles

Skills should be:

- **Focused**: One skill per domain (testing, migrations, routing)
- **Actionable**: Include concrete examples and file paths
- **Discoverable**: Listed in skills README with decision tree
- **Cross-referenced**: Link to related skills and ADRs

### 4. Prompt Design Principles

Prompts should:

- **Define completion criteria**: Clear "Definition of Done"
- **Structure workflow phases**: Step-by-step progression
- **Reference skills**: Delegate to skills for domain details
- **Support partial execution**: Allow stopping and resuming

### 5. Claude Code Sync Mechanism

To support Claude Code CLI (which uses `.claude/skills/` not `.github/prompts/`), we maintain
synchronization:

```
.github/prompts/*.prompt.md  ──sync──▶  .claude/skills/*/SKILL.md
.github/skills/*/SKILL.md   ──sync──▶  .claude/skills/*/SKILL.md
```

The sync script (`scripts/sync-claude-skills.js`) copies content to maintain feature parity
between GitHub Copilot and Claude Code.

### 6. Documentation Consistency

To prevent drift:

- **INSTRUCTIONS_CHANGELOG.md**: Tracks all AI instruction changes
- **doc-audit prompt**: Comprehensive verification against codebase
- **doc-review skill**: Incremental checks after code changes

## Implementation

### Directory Structure

```
.github/
├── copilot-instructions.md           # Main Copilot instructions
├── INSTRUCTIONS_CHANGELOG.md         # Change tracking
├── skills/
│   ├── README.md                     # Decision tree & index
│   ├── feature-scaffold/SKILL.md
│   ├── testing-workflow/SKILL.md
│   ├── api-design/SKILL.md
│   └── ... (16 skills total)
├── prompts/
│   ├── implement.prompt.md           # Full feature workflow
│   ├── validate.prompt.md            # Quality checks
│   └── ... (9 prompts total)
└── chatmodes/
    ├── onboarding.chatmode.md
    └── planning.chatmode.md

.claude/
└── skills/                           # Synced from .github/prompts + .github/skills
    ├── implement/SKILL.md
    ├── validate/SKILL.md
    └── ...

CLAUDE.md                             # Claude Code core instructions (root)
```

### Sync Script

```javascript
// scripts/sync-claude-skills.js
// Syncs both prompts AND skills to .claude/skills/
// Run: npm run sync:claude-skills
```

### Naming Conventions

| Artifact  | Naming Pattern           | Example                 |
| --------- | ------------------------ | ----------------------- |
| Skill     | `kebab-case` folder      | `testing-workflow/`     |
| Prompt    | `kebab-case.prompt.md`   | `implement.prompt.md`   |
| Chat Mode | `kebab-case.chatmode.md` | `planning.chatmode.md`  |
| ADR       | `ADR-###-kebab-case.md`  | `ADR-014-ai-tooling.md` |

## Consequences

### Positive

- **Comprehensive coverage**: AI agents have access to all project patterns
- **Discoverability**: Decision tree helps find the right skill
- **Consistency**: Sync mechanism ensures tool parity
- **Maintainability**: Modular structure enables focused updates
- **Auditability**: Changelog tracks instruction evolution

### Negative

- **Maintenance overhead**: More files to keep in sync
- **Learning curve**: Contributors must understand the structure
- **Sync discipline**: Changes must run sync script

### Risks and Mitigations

| Risk                         | Mitigation                                      |
| ---------------------------- | ----------------------------------------------- |
| Instructions drift from code | doc-audit prompt, doc-review skill              |
| Sync script not run          | Add to CI, pre-commit hook consideration        |
| Conflicting instructions     | Core instructions take precedence, cross-refs   |
| Information overload         | Decision tree, focused skills, layered approach |

## Future Considerations

1. **Automated sync in CI**: Verify .claude/skills/ stays in sync
2. **Skill versioning**: Track skill effectiveness over time
3. **AI feedback loop**: Capture when AI deviates from instructions
4. **Skill generation**: Auto-generate skills from code patterns

## Related Documentation

- [Skills Index](../../.github/skills/README.md) - Decision tree and skill catalog
- [Copilot Instructions](../../.github/copilot-instructions.md) - Core AI guidance
- [INSTRUCTIONS_CHANGELOG](../../.github/INSTRUCTIONS_CHANGELOG.md) - Change history
