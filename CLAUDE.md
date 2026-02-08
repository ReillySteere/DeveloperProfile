# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Live Site:** [reillygoulding.ca](https://www.reillygoulding.ca)

## Quick Reference

| Task         | Command               |
| ------------ | --------------------- |
| Dev mode     | `npm start`           |
| Test all     | `npm test`            |
| Server tests | `npm run test:server` |
| UI tests     | `npm run test:ui`     |
| E2E tests    | `npm run test:e2e`    |
| Lint         | `npm run lint`        |
| Type check   | `npm run type-check`  |
| Build        | `npm run build`       |

## Documentation Index

For detailed guidance, refer to:

| Topic                      | Location                          |
| -------------------------- | --------------------------------- |
| **Full instructions**      | `.github/copilot-instructions.md` |
| **Skills (domain guides)** | `.github/skills/`                 |
| **Component docs**         | `architecture/components/`        |
| **ADRs (30 decisions)**    | `architecture/decisions/`         |
| **API docs**               | `http://localhost:3000/api/docs`  |

## Architecture Overview

**Modular Monolith with BFF pattern**: NestJS backend + React 19 frontend in single deployable.

### Path Aliases

- `server/*` → `src/server/`
- `ui/*` → `src/ui/`
- `shared/*` → `src/shared/`

### Backend Structure (`src/server/`)

- **Business Modules**: `modules/` - Feature-specific (about, blog, experience, projects, traces, auth)
- **Shared Modules**: `shared/modules/` - Cross-cutting concerns (auth, logger)
- **Hexagonal Architecture**: Shared modules use ports/adapters pattern
  - `shared/ports/` - Interface contracts
  - `shared/adapters/` - Implementations that bridge business modules to shared modules
  - Business modules import from adapters/ports only, never directly from shared module internals
- **Domain Flow**: Controller → Service → Repository (all may use Domain Objects)

### Frontend Structure (`src/ui/`)

- **Feature Containers**: `containers/<feature>/` - Each has components/, hooks/, and \*.container.tsx
- **Shared**: `shared/components/`, `shared/hooks/` (includes Zustand stores)
- **Routing**: TanStack Router - **DO NOT EDIT** `routeTree.gen.ts` (auto-generated)
- **State**: TanStack Query (server state) + Zustand (global state)

## Key Patterns

### Backend

- **Logging**: Use `LoggerService` from `server/shared/adapters/logger/`. Never use `console.log`.
- **Events**: Use `@nestjs/event-emitter`. Define event constants in module's `events.ts` file.
- **fromEvent typing**: Use type assertions in callbacks, not generic parameters (deprecated in RxJS v8).
- **Testing**:
  - Unit tests: Manual DI (e.g., `new Filter()`)
  - Integration tests: `Test.createTestingModule` with `:memory:` SQLite

### Frontend

- **Styling**: SCSS Modules with CSS variables from `shared/styles/tokens.css`. Never hardcode colors/spacing.
- **Auth**: Handled globally via `AuthInterceptor`. Do not manually add Authorization headers.
- **Components**: Import from `ui/shared/components` barrel. Prefer shared components (Button, Card, Badge, Skeleton) over bespoke ones.
- **Accessibility**: WCAG 2.1 AA required. Use semantic HTML, add jest-axe tests.
- **Testing**: Integration tests at container level. Mock network layer with MSW, not internal hooks.

## Test Utilities

- **UI**: `src/ui/test-utils/` - `render` wrapper, `MockEventSource`, `mockRecharts`
- **Server**: `src/server/test-utils/cronTestUtils.ts`
- **Global Mocks**: ESM libs mocked in `jest-preloaded.ts` (react-markdown, mermaid, web-vitals)

## Running Single Tests

```bash
npx jest path/to/file.test.ts --config jest.node.ts    # Server
npx jest path/to/file.test.tsx --config jest.browser.ts # UI
```

## Database Migrations

```bash
npm run migration:generate -- src/server/migrations/MigrationName
npm run migration:run
```

Migrations **MUST be idempotent**. Use `IF NOT EXISTS` and `PRAGMA table_info()` checks.
