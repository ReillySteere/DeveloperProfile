# Copilot Instructions

## Architecture Overview

- **Style:** Modular Monolith with Backend for Frontend (BFF) pattern.
- **Full-Stack Monorepo:** NestJS (backend) + React 19 (frontend).
- **Shared:** Common types in `src/shared/types/` (aliased as `shared/*`).
- **Frontend (`src/ui`):**
  - **Framework:** React 19 + TanStack Router + TanStack Query + Zustand.
  - **Build:** Webpack.
  - **Styling:** SCSS Modules (`*.module.scss`).
- **Backend (`src/server`):**
  - **Framework:** NestJS + TypeORM + SQLite.
  - **Auth:** Passport JWT.
- **Path Aliases:** `ui/*`, `shared/*`, `server/*` (configured in `tsconfig.json`).

## Critical Workflows

- **Start:** `npm start` (concurrently runs `start:server:dev` and `start:ui`).
- **Test:** `npm test` (runs `test:server` and `test:ui`).
  - **Coverage:** 100% required for statements, branches, functions, lines.
- **Lint:** `npm run lint` (ESLint + Prettier + React Compiler).
- **Format:** `npm run format` (runs `format:server` and `format:ui`).
- **Type Check:** `npm run type-check` (runs `tsc --noEmit`).
- **Dependency Check:** `npm run depcruise:verify` (validates architectural boundaries).
- **Build:** `npm run build` (runs `build:server` and `build:ui`).
- **Docker:**
  - Build: `docker build -t profile-app .`
  - Run: `docker run -p 3000:3000 profile-app`

## Code Generation Requirements

- **Workflow:** Edit ONE file at a time. For complex tasks, propose a plan first.
- **Safety:** Always run tests after changes.
- **Style:** Follow existing patterns (functional components, manual DI for server unit tests).
- **Before/After Protocol:** Include clear before/after code snippets when proposing changes.
- **Documentation Consistency:** When modifying any `.md` file in `.github/` or `architecture/`, review related documentation for consistency before marking the task complete. Use the `doc-review` skill.
- **Validation:** Before committing, run `/validate` to check types, lint, tests, and dependencies.
- **Full Implementation:** For end-to-end feature work with automatic MR creation, use `/implement`.

## Backend Patterns (`src/server`)

- **Structure:** Modules, Controllers, Services.
- **Data Access:** TypeORM with SQLite (`data/database.sqlite`).
- **Logging:** Use `LoggerService` from `server/shared/adapters/logger/`. **NEVER use `console.log/warn/error`** in server code. The only exception is `main.ts` for fatal bootstrap errors.
- **Testing:**
  - **Unit:** Manual dependency injection (e.g., `new Filter()`). See `src/server/sentry-exception.filter.test.ts`.
  - **Integration:** Use `Test.createTestingModule` with `:memory:` database. See `src/server/modules/experience/experience.integration.test.ts`.
  - **Hybrid Approach:** When discrete functions in a service are too difficult to test at the integration layer (e.g., scheduled tasks, event handlers, database maintenance), create unit tests with mocked dependencies alongside integration tests.
- **API:** Controllers mapped to `/api/*`. Global ValidationPipe enabled.
- **Error Handling:** Global `SentryExceptionFilter`.
- **Auth:** Shared module at `src/server/shared/modules/auth/` (Passport JWT).
  - **Hexagonal Architecture:** Shared modules follow ports/adapters pattern (see ADR-005).
  - **Adapters:** `src/server/shared/adapters/` - Use these to consume shared modules.
  - **Ports:** `src/server/shared/ports/` - Interface contracts for adapters.
  - **Business Auth Controller:** `src/server/modules/auth/` - Application endpoints.
- **Architecture:** File-based module at `src/server/modules/architecture/` (no database).
  - Reads ADRs from `architecture/decisions/` and component docs from `architecture/components/`.
  - Serves pre-generated dependency graphs from `public/data/dependency-graphs.json`.
- **Event-Driven Architecture (EDA):**
  - Use `EventEmitter2` from `@nestjs/event-emitter` for internal events.
  - **Event Names:** Define as constants in a dedicated `events.ts` file within the module (e.g., `src/server/modules/traces/events.ts`). Export a `TRACE_EVENTS` object for namespaced access.
  - **Emitting Events:** Services should emit events even if no listeners exist yet (loose coupling).
  - **Consuming Events:** Use `fromEvent()` from `rxjs` for SSE endpoints or `@OnEvent()` decorator for handlers.
  - **Pattern:** `<domain>.<action>` (e.g., `trace.created`, `alert.triggered`).
  - **fromEvent Typing:** Do NOT use explicit type parameters (deprecated in RxJS v8). Instead, use type assertions in the callback:
    ```typescript
    // ✅ Correct - type assertion in map
    fromEvent(eventEmitter, TRACE_EVENTS.TRACE_CREATED).pipe(
      map((trace) => ({ data: trace as RequestTrace }))
    );
    // ❌ Wrong - explicit type parameter (deprecated)
    fromEvent<RequestTrace>(eventEmitter, 'trace.created').pipe(...)
    ```
- **Rate Limiting:**
  - Use `@nestjs/throttler` with custom `RateLimitGuard` for per-endpoint limits.
  - Configure rules in `rate-limit.config.ts` with pattern, limit, and TTL.
  - See ADR and docs in `architecture/features/phase-2-observability/rate-limiting.md`.
- **Scheduled Tasks:**
  - Use `@nestjs/schedule` with `@Cron()` decorator for recurring tasks.
  - Define cron expressions as constants in a dedicated config file.
  - Test cron handlers with unit tests using `src/server/test-utils/cronTestUtils.ts`.
  - See ADR-012 for patterns.
- **Alerting:**
  - Alert channels implement `IAlertChannel` interface in traces module.
  - Add new channels in `src/server/modules/traces/channels/`.
  - See `architecture/features/phase-2-observability/alerting.md` for extension guide.

## Frontend Patterns (`src/ui`)

- **Directory Structure:**
  - **Feature Folders:** `src/ui/containers/<feature>/` (e.g., `src/ui/containers/experience/`) containing:
    - `components/`: Feature-specific components.
    - `hooks/`: Feature-specific hooks (e.g., `useExperience.ts`).
    - `*.container.tsx`: Main feature container.
  - **Shared:** `src/ui/shared/` containing:
    - `components/`: Reusable UI components (Button, Card, etc.). **ALWAYS** import from `ui/shared/components` (barrel file).
    - `hooks/`: Shared hooks including Zustand stores (`useAuthStore`, `useNavStore`).
    - `routes/`: Route definitions (TanStack Router).
  - **Test Utils:** `src/ui/test-utils/`.
- **Routing:** TanStack Router.
  - **DO NOT EDIT** `src/ui/routeTree.gen.ts`.
  - **Patterns:** Supports flat and nested routes (e.g., `/blog` parent with `/blog/$slug` child).
- **State Management:**
  - **Server State:** TanStack Query via custom hooks. Use `QueryState` component for handling loading/error/empty states.
  - **Global State:** Zustand (e.g., `navStore`).
  - **Authentication:** Handled globally via `AuthInterceptor` (Request & Response). **DO NOT** manually add Authorization headers in hooks.
- **Components:** Functional components. Use `Frame` component for page layout.
- **Styling:** SCSS Modules (`*.module.scss`).
  - **ALWAYS use CSS variables** from `src/ui/shared/styles/tokens.css`. Never hardcode colors, spacing, or other design tokens.
  - **Semantic tokens:** `--bg-surface`, `--text-primary`, `--border-default`, `--primary-default`, etc.
  - **Spacing:** `--space-1` (0.25rem) through `--space-16` (4rem).
  - **Radius:** `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`.
  - **Dark mode:** Tokens auto-switch via `[data-theme='dark']`.
- **Testing:**
  - Use `render` from `ui/test-utils` (wraps `QueryClientProvider`).
  - Test files: `src/ui/**/*.test.ts*`.
  - **Strategy:** UI tests must be **integration tests** at the container level.
    - Do not create unit tests for child components unless absolutely necessary (e.g. complex shared components).
    - Cover all edge cases and branch logic via the container integration suite.
    - **Do not mock internal hooks** used within the container.
  - **API Mocking (MSW - Required for new tests):** Use MSW handlers from `ui/test-utils/msw`.
    - Default handlers are set up globally in `jest-preloaded.ts`.
    - Use `server.use()` to override handlers for specific test scenarios.
    - Handler factories: `createTraceHandlers()`, `createBlogHandlers()`, `createAuthHandlers()`, etc.
  - **User Interactions (userEvent - Required):** Use `userEvent` from `ui/test-utils`, NOT `fireEvent`.
    - `const user = userEvent.setup();` at the start of each test.
    - `await user.click()`, `await user.type()`, `await user.keyboard()`.

## Testing Specifics

- **Engine:** `@swc/jest` (fast compilation for tests).
- **Framework:** Jest 30+.
- **Configs:** `jest.browser.ts` (UI) and `jest.node.ts` (Server).
- **UI Utils:** Located in `src/ui/test-utils/` (aliased as `test-utils` in Jest).
- **API Mocking:**
  - **MSW (Preferred):** Network-level mocking via `ui/test-utils/msw`. Handlers defined in `src/ui/test-utils/msw/handlers.ts`.
  - **axios mocks (Legacy):** Still supported but MSW is preferred for new tests.
- **Mocks:**
  - Use `jest.mock` with `__esModule: true`.
  - Prefix mock variables with `mock` (e.g., `mockUpdate`).
  - Remember Jest hoists `jest.mock()` calls.
  - **ESM Modules:** Libraries like `react-markdown` and `mermaid` require specific mocking strategies (see `src/ui/containers/blog/blog.container.test.tsx`).
- **Test Helpers:**
  - **SSE Streams:** Use `MockEventSource` from `ui/test-utils/mockEventSource` to test Server-Sent Events.
  - **Recharts:** Use `mockRecharts` from `ui/test-utils/mockRecharts` to mock chart components.
  - **Cron Jobs:** Use `cronTestUtils` from `server/test-utils/cronTestUtils` to test scheduled tasks.
  - **MSW Handlers:** Use handler factories from `ui/test-utils/msw` for API mocking.
  - See `architecture/features/phase-2-observability/visualization.md` for testing patterns.

## Key Files

- `src/server/app.module.ts`: Main backend module.
- `src/ui/routeTree.gen.ts`: Generated routes.
- `src/ui/containers/experience/hooks/useExperience.ts`: Example data fetching hook.
- `src/server/modules/experience/experience.controller.ts`: Example controller.
- `src/ui/containers/blog/blog.container.tsx`: Example of nested routing and list/detail views.

## Pull Request Workflow

When using the `create-pr` prompt (`.github/prompts/create-pr.prompt.md`):

- **Newlines:** Use actual line breaks in the `--body` string, NOT `\n` escape sequences.
- **File Paths:** Use relative paths without leading slashes (e.g., `src/server/` not `/src/server/`).
- **Backticks (PowerShell):** Double the backticks: ` `` ` renders as `` ` `` (backtick is PowerShell's escape char).
- **Backticks (Bash):** Escape with backslash: `` \` `` renders as `` ` ``.
