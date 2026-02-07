---
name: dependency-enforcement
description: Checks and enforces project dependency rules using dependency-cruiser.
---

# Dependency Enforcement

Use this skill to verify that code changes (especially imports) respect the strict Modular Monolith boundaries.

## 1. Configuration Files

**IMPORTANT:** This project uses THREE dependency-cruiser config files:

| File                            | Purpose                                        | Command                    |
| ------------------------------- | ---------------------------------------------- | -------------------------- |
| `.dependency-cruiser.js`        | Core/shared rules (base config)                | N/A (extended by others)   |
| `.dependency-cruiser.server.js` | Server-specific rules + hexagonal architecture | `npm run depcruise:server` |
| `.dependency-cruiser.ui.js`     | UI-specific rules + view isolation             | `npm run depcruise:ui`     |

When reviewing or modifying dependency rules, **always check all three files**.

## 2. Rules Overview

### Core Rules (`.dependency-cruiser.js`)

- `no-circular`: Warn on circular dependencies
- `no-orphans`: Info on unused modules
- `no-deprecated-core`: Warn on deprecated Node.js modules
- `server-no-ui`: Server cannot import UI
- `ui-no-server`: UI cannot import Server
- `controller-no-repository`: Controllers use Services, not Repositories
- `service-no-controller`: Services cannot import Controllers
- `feature-isolation` (UI): Features shouldn't import other features
- `components-no-containers`: Presentational components shouldn't import containers

### Server Rules (`.dependency-cruiser.server.js`)

- `module-isolation`: Feature modules cannot import other feature modules
- `shared-no-modules`: Shared code cannot import feature modules
- **Hexagonal Architecture (ADR-005):**
  - `shared-module-encapsulation`: Business modules must use adapters, not shared module internals
  - `ports-no-implementation-deps`: Ports cannot import modules or adapters
- **Cross-Module Entity Rules (ADR-023):**
  - `entity-no-bidirectional`: Core entities cannot reference dependent entities
  - `cross-module-entity-only`: Only entity files can cross module boundaries
  - `repository-internal-only`: Repositories are private to their module

### UI Rules (`.dependency-cruiser.ui.js`)

- `feature-isolation`: Feature containers isolated from each other
- `ui-no-dto`: UI cannot import DTO files
- `view-isolation`: Views cannot import other views
- `shared-no-features`: Shared UI cannot import feature containers
- `only-containers-access-views`: Only containers can import from `/views/`
- `services-no-react`: Services must be framework-agnostic (no React imports)
- `shared-hooks-only-shared-services`: Shared hooks cannot import from feature containers
- `shared-components-no-feature-services`: Shared components cannot use feature hooks/services
- `feature-services-stay-local` (warn): Promotes moving reusable code to shared
- `feature-components-internal-only`: Feature components private to their feature
- `shared-components-use-barrel`: Import shared components via barrel file (`ui/shared/components`)

## 3. Running Checks

### VS Code Task (Recommended)

| Task ID                   | Description                    |
| ------------------------- | ------------------------------ |
| `shell: depcruise verify` | Run full dependency validation |

### Terminal Commands

```bash
# Check All
npm run depcruise:verify

# Check Server only
npm run depcruise:server

# Check UI only
npm run depcruise:ui
```

### Visualizing Dependencies

```bash
npm run depcruise:graph:server
npm run depcruise:graph:ui
```

## 4. Common Violations

| Violation                                            | Fix                                                    |
| ---------------------------------------------------- | ------------------------------------------------------ |
| Importing a DTO from `src/server` into `src/ui`      | Move type to `src/shared/types`                        |
| Importing from `shared/modules/auth/auth.service.ts` | Use adapter: `shared/adapters/auth`                    |
| Feature A importing Feature B                        | Extract to `shared/` or duplicate                      |
| View importing another view                          | Refactor to component or hook                          |
| Importing shared component directly                  | Use barrel: `import { X } from 'ui/shared/components'` |
| Feature hook used by shared component                | Move hook to `shared/hooks` or redesign                |

## 5. Adding New Rules

When adding rules for new architectural patterns:

1. Determine scope: Core (both), Server-only, or UI-only
2. Add to the appropriate config file
3. Update this skill documentation
4. Run `npm run depcruise:verify` to test
