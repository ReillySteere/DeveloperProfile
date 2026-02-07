# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm start                    # Dev mode: runs UI (webpack) + server (NestJS) concurrently
npm run build                # Production build (server + UI)
npm test                     # All tests with coverage (100% threshold required)
npm run test:server          # Server tests only (jest.node.ts)
npm run test:ui              # UI tests only (jest.browser.ts)
npm run test:e2e             # Playwright E2E tests (requires dev server running)
npm run lint                 # ESLint + Prettier + React Compiler
npm run type-check           # TypeScript check (tsc --noEmit)
npm run depcruise:verify     # Validate architectural boundaries
```

### Running a Single Test

```bash
npx jest path/to/file.test.ts --config jest.node.ts    # Server test
npx jest path/to/file.test.tsx --config jest.browser.ts # UI test
```

### Database Migrations

```bash
npm run migration:generate -- src/server/migrations/MigrationName
npm run migration:run
npm run migration:revert
```

## Architecture Overview

**Modular Monolith with BFF pattern**: NestJS backend + React 19 frontend in a single deployable unit.

### Path Aliases

- `server/*` → `src/server/`
- `ui/*` → `src/ui/`
- `shared/*` → `src/shared/` (shared types between frontend/backend)

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
- **Components**: Import shared components from `ui/shared/components` barrel file. Direct imports are blocked by dependency-cruiser.
- **Testing**: Integration tests at container level. Mock network layer, not internal hooks.

## Test Utilities

- **UI**: `src/ui/test-utils/` - includes `render` wrapper, `MockEventSource` (SSE), `mockRecharts`
- **Server**: `src/server/test-utils/cronTestUtils.ts` - testing scheduled tasks
- **Global Mocks**: ESM libraries (`react-markdown`, `mermaid`, `web-vitals`) are mocked globally in `jest-preloaded.ts` - no per-test mocking needed

## API Documentation

Swagger docs available at `http://localhost:3000/api/docs` when server is running.
