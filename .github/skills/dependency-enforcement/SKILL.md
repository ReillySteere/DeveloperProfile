---
name: dependency-enforcement
description: Checks and enforces project dependency rules using dependency-cruiser.
---

# Dependency Enforcement

Use this skill to verify that code changes (especially imports) respect the strict Modular Monolith boundaries.

## 1. Rules Overview

- **Strict Boundary**: `src/ui` CANNOT import `src/server`.
- **Strict Boundary**: `src/server` CANNOT import `src/ui`.
- **Shared**: Both can import `src/shared`.
- **UI Data Rules**:
  - `src/ui` must NOT contain DTOs (Class-based Data Transfer Objects). Use Types/Interfaces in `src/shared` for API contracts.
- **View Isolation**:
  - Views (e.g., in `src/ui`) should NOT import other views.
  - Sibling components with distinct states (e.g., Blog List vs Blog Detail) must remain isolated and orchestrated by a Container or Router.

## 2. Running Checks

The project uses `dependency-cruiser`.

### VS Code Task (Recommended)

Use the VS Code task for reliable execution:

| Task ID                   | Description                    |
| ------------------------- | ------------------------------ |
| `shell: depcruise verify` | Run full dependency validation |

### Terminal Commands

#### Check All

```bash
npm run depcruise:verify
```

#### Check Server

```bash
npm run depcruise:server
```

#### Check UI

```bash
npm run depcruise:ui
```

### Visualizing Dependencies

Generate an SVG graph of dependencies:

```bash
npm run depcruise:graph:server
npm run depcruise:graph:ui
```

## 3. Common Violations

- Importing a DTO from `src/server` into `src/ui`. **Fix**: Move the DTO to `src/shared/types`.
- Importing a utility from `src/ui` into `src/server`. **Fix**: Duplicate logic or move to `src/shared/util`.
