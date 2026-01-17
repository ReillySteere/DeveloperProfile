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

## Backend Patterns (`src/server`)

- **Structure:** Modules, Controllers, Services.
- **Data Access:** TypeORM with SQLite (`data/database.sqlite`).
- **Testing:**
  - **Unit:** Manual dependency injection (e.g., `new Filter()`). See `src/server/sentry-exception.filter.test.ts`.
  - **Integration:** Use `Test.createTestingModule` with `:memory:` database. See `src/server/modules/experience/experience.integration.test.ts`.
- **API:** Controllers mapped to `/api/*`. Global ValidationPipe enabled.
- **Error Handling:** Global `SentryExceptionFilter`.
- **Auth:** Located in `src/server/shared/modules/auth/` (Passport JWT).

## Frontend Patterns (`src/ui`)

- **Directory Structure:**
  - **Feature Folders:** `src/ui/containers/<feature>/` (e.g., `src/ui/containers/experience/`) containing:
    - `components/`: Feature-specific components.
    - `hooks/`: Feature-specific hooks (e.g., `useExperience.ts`).
    - `*.container.tsx`: Main feature container.
  - **Shared:** `src/ui/shared/` containing:
    - `components/`: Reusable UI components (Button, Card, etc.). **ALWAYS** import from `ui/shared/components` (barrel file).
    - `routes/`: Route definitions (TanStack Router).
    - `stores/`: Global state (Zustand).
  - **Test Utils:** `src/ui/test-utils/`.
- **Routing:** TanStack Router.
  - **DO NOT EDIT** `src/ui/routeTree.gen.ts`.
  - **Patterns:** Supports flat and nested routes (e.g., `/blog` parent with `/blog/$slug` child).
- **State Management:**
  - **Server State:** TanStack Query via custom hooks. Use `QueryState` component for handling loading/error/empty states.
  - **Global State:** Zustand (e.g., `navStore`).
  - **Authentication:** Handled globally via `AuthInterceptor` (Request & Response). **DO NOT** manually add Authorization headers in hooks.
- **Components:** Functional components. Use `Frame` component for page layout.
- **Testing:**
  - Use `render` from `ui/test-utils` (wraps `QueryClientProvider`).
  - Test files: `src/ui/**/*.test.ts*`.
  - **Strategy:** UI tests must be **integration tests** at the container level.
    - Do not create unit tests for child components unless absolutely necessary (e.g. complex shared components).
    - Cover all edge cases and branch logic via the container integration suite.
    - **Do not mock internal hooks** used within the container; rely on `msw` or `axios` mocks for the network layer.

## Testing Specifics

- **Engine:** `@swc/jest` (fast compilation for tests).
- **Framework:** Jest 30+.
- **Configs:** `jest.browser.ts` (UI) and `jest.node.ts` (Server).
- **UI Utils:** Located in `src/ui/test-utils/` (aliased as `test-utils` in Jest).
- **Mocks:**
  - Use `jest.mock` with `__esModule: true`.
  - Prefix mock variables with `mock` (e.g., `mockUpdate`).
  - Remember Jest hoists `jest.mock()` calls.
  - **ESM Modules:** Libraries like `react-markdown` and `mermaid` require specific mocking strategies (see `src/ui/containers/blog/blog.container.test.tsx`).

## Key Files

- `src/server/app.module.ts`: Main backend module.
- `src/ui/routeTree.gen.ts`: Generated routes.
- `src/ui/containers/experience/hooks/useExperience.ts`: Example data fetching hook.
- `src/server/modules/experience/experience.controller.ts`: Example controller.
- `src/ui/containers/blog/blog.container.tsx`: Example of nested routing and list/detail views.
