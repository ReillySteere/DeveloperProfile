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
npm run verify:migrations    # Check migration idempotency
npm run scaffold <name>      # Generate full-stack feature boilerplate
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

Migrations must be idempotent: use `IF NOT EXISTS` for tables/indexes, check `PRAGMA table_info` before `ALTER TABLE ADD COLUMN`.

## Architecture Overview

**Modular Monolith with BFF pattern**: NestJS backend + React 19 frontend in a single deployable unit. Node.js >=22.14.0 required.

### Path Aliases

- `server/*` → `src/server/`
- `ui/*` → `src/ui/`
- `shared/*` → `src/shared/` (shared types between frontend/backend)

### Backend Structure (`src/server/`)

- **Business Modules** (`modules/`): about, api-root, architecture, auth, blog, case-studies, experience, health, performance, projects, rate-limit, seeding, traces
- **Shared Modules** (`shared/modules/`): auth (JWT/Passport), logger (global)
- **Hexagonal Architecture**: Shared modules use ports/adapters pattern
  - `shared/ports/` - Interface contracts (`IAuthenticationPort`, `ILoggingPort`, `ITraceServicePort`)
  - `shared/adapters/` - Implementations that bridge business modules to shared modules
  - Business modules import from adapters/ports only, never directly from shared module internals
- **Domain Flow**: Controller → Service → Repository (all may use Domain Objects)
- **Global Middleware**:
  - `RateLimiterGuard` (APP_GUARD) - Sliding window rate limiting per IP/user
  - `TracingInterceptor` (APP_INTERCEPTOR) - Request timing/metadata capture
  - `SentryExceptionFilter` - Global exception capture
  - `ValidationPipe` - Global validation (`whitelist: true`, `forbidNonWhitelisted: true`)

#### DI Token Pattern

Each module defines `tokens.ts` with Symbol-based tokens:

```typescript
const TOKENS = { Service: Symbol('Service'), Repository: Symbol('Repository') } as const;
```

Services are injected via `@Inject(TOKENS.Service)` and exported from modules by token.

#### Entities (registered in `data-source.ts`)

Experience, Project, BlogPost, User, RequestTrace, AlertHistory, RateLimitEntry, CaseStudy, PerformanceReport, BundleSnapshot

### Frontend Structure (`src/ui/`)

- **Feature Containers** (`containers/`): about, accessibility, architecture, blog, case-studies, experience, performance, projects, status (with nested traces sub-container)
- **Container Pattern**: Each has `<feature>.container.tsx`, `components/`, `hooks/`, optional `views/` and `utils/`
- **Shared**: `shared/components/`, `shared/hooks/` (Zustand stores), `shared/services/` (framework-agnostic logic)
- **Routing**: TanStack Router with file-based routing - **DO NOT EDIT** `routeTree.gen.ts` (auto-generated). Run `npm run generate-routes` after adding/removing route files.
- **State**: TanStack Query (server state) + Zustand (global state via `useAuthStore`, `useNavStore`)
- **Shared Components**: Badge, Button, Card, Frame, LinkButton, MarkdownContent, Mermaid, NavigationRail, PerformanceBadge, QueryState, Skeleton, AuthInterceptor, SignIn

### Shared Types (`src/shared/types/`)

Communication contract between frontend and backend: about, architecture, blog, case-study, experience, performance, projects, rate-limit, telemetry, trace types.

## Key Patterns

### Backend

- **Logging**: Use `LoggerService` from `server/shared/adapters/logger/`. Never use `console.log`.
- **Events**: Use `@nestjs/event-emitter`. Define event constants in module's `events.ts` file. Event names use `<domain>.<action>` format (e.g., `trace.created`, `case-study.updated`).
- **fromEvent typing**: Use type assertions in callbacks, not generic parameters (deprecated in RxJS v8).
- **Testing**:
  - Unit tests: Manual DI (e.g., `new Filter()`)
  - Integration tests: `Test.createTestingModule` with `:memory:` SQLite
- **Controllers**: Use `@ApiTags`, `@ApiOperation`, `@ApiResponse` for Swagger. Use `@UseGuards(AuthGuardAdapter)` for protected endpoints.

### Frontend

- **Styling**: SCSS Modules with CSS variables from `shared/styles/tokens.css`. Never hardcode colors/spacing. Theme switching via `data-theme` attribute.
- **Auth**: Handled globally via `AuthInterceptor`. Do not manually add Authorization headers.
- **Components**: Import shared components from `ui/shared/components` barrel file. Direct imports are blocked by dependency-cruiser.
- **Testing**: Integration tests at container level. Mock network layer (MSW), not internal hooks.
- **Query Hooks**: Cache keys use `['domain', 'resource', 'param']` pattern. Use `staleTime: Infinity` for static content.

### Architectural Boundaries (enforced by dependency-cruiser)

**Backend**:
- Business modules cannot import from `shared/modules/*` internals — use adapters/ports
- Adapters cannot depend on other adapters
- Controllers cannot directly access repositories
- Circular dependencies forbidden

**Frontend**:
- Feature containers cannot import from other feature containers
- Shared components cannot import from feature containers
- Views are private to containers (only `.container.tsx` can import from `views/`)
- Shared components must use barrel file imports
- UI code cannot import server code or DTOs (use shared types)

## Test Utilities

- **UI** (`src/ui/test-utils/`):
  - `render` wrapper (provides QueryClientProvider)
  - `MockEventSource` for SSE testing
  - `mockRecharts`, `mockMarkdown`, `mockWebVitals` (global mocks)
  - `axios-fetch-adapter.ts` - Makes axios work with MSW in Node.js tests
  - `msw/` - Mock Service Worker setup with handler factories and mock data for all API endpoints
- **Server** (`src/server/test-utils/`):
  - `cronTestUtils.ts` - Testing scheduled tasks
  - `mockEventEmitter.ts`, `mockSentry.ts`, `mockNodemailer.ts` - Service mocks
  - `builders.ts` - Test data builders
- **Global Mocks**: ESM libraries (`react-markdown`, `mermaid`, `web-vitals`) are mocked globally in `jest-preloaded.ts` - no per-test mocking needed
- **Coverage**: 100% threshold for statements, branches, functions, and lines

## Quality Gates

### Commit Conventions

Conventional Commits enforced by commitlint: `<type>(<scope>): <subject>` (max 100 chars). Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

### Pre-push Hook (Husky)

Runs tests, lint, format check, and dependency validation before push.

### CI Pipeline (GitHub Actions)

Security audit → Static checks (routes, format, lint, types, depcruise, migration idempotency) → Unit tests (server + UI with coverage) → E2E tests (Playwright) → Docker build.

## API Documentation

Swagger docs available at `http://localhost:3000/api/docs` when server is running.
