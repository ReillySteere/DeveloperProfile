# Copilot Instructions

## Architecture Overview
- **Full-Stack Monorepo:** NestJS (backend) + React 19 (frontend).
- **Shared:** Common types in `src/shared/types/` (aliased as `shared/*`).
- **Frontend (`src/ui`):**
  - **Framework:** React 19 + TanStack Router + TanStack Query + Zustand.
  - **Build:** Webpack.
  - **Styling:** SCSS Modules (`*.module.scss`).
- **Backend (`src/server`):**
  - **Framework:** NestJS + TypeORM + SQLite.
  - **Auth:** Passport JWT.
- **Path Aliases:** `ui/*`, `shared/*`, `backend/*` (configured in `tsconfig.json`).

## Critical Workflows
- **Start:** `npm start` (concurrently runs `start:server:dev` and `start:ui`).
- **Test:** `npm test` (runs `test:server` and `test:ui`).
  - **Coverage:** 100% required for statements, branches, functions, lines.
- **Lint:** `npm run lint` (ESLint + Prettier + React Compiler).
- **Format:** `npm run format` (runs `format:server` and `format:ui`).
- **Build:** `npm run build` (runs `build:server` and `build:ui`).

## Code Generation Requirements
- **Workflow:** Edit ONE file at a time. For complex tasks, propose a plan first.
- **Safety:** Always run tests after changes.
- **Style:** Follow existing patterns (functional components, manual DI for server unit tests).
- **Before/After Protocol:** Include clear before/after code snippets when proposing changes.

## Backend Patterns (`src/server`)
- **Structure:** Modules, Controllers, Services.
- **Data Access:** TypeORM with SQLite (`data/database.sqlite`).
- **Testing:**
  - **Unit:** Manual dependency injection (e.g., `new Service(mockDep)`). See `src/server/auth/auth.service.test.ts`.
  - **Integration:** Use `Test.createTestingModule` with `:memory:` database. See `src/server/modules/experience/experience.integration.test.ts`.
- **API:** Controllers mapped to `/api/*`. Global ValidationPipe enabled.
- **Error Handling:** Global `SentryExceptionFilter`. Use `ErrorMessage` utility.

## Frontend Patterns (`src/ui`)
- **Directory Structure:**
  - **Feature Folders:** `src/ui/<feature>/` (e.g., `src/ui/experience/`) containing:
    - `components/`: Feature-specific components.
    - `hooks/`: Feature-specific hooks (e.g., `useExperience.ts`).
    - `*.container.tsx`: Main feature container.
  - **Shared:** `src/ui/shared/` containing:
    - `components/`: Reusable UI components (Button, Card, etc.).
    - `routes/`: Route definitions (TanStack Router).
    - `stores/`: Global state (Zustand).
  - **Test Utils:** `src/ui/test-utils/`.
- **Routing:** TanStack Router. **DO NOT EDIT** `src/ui/routeTree.gen.ts`.
- **State Management:**
  - **Server State:** TanStack Query via custom hooks.
  - **Global State:** Zustand (e.g., `navStore`).
- **Components:** Functional components.
- **Testing:**
  - Use `render` from `ui/test-utils` (wraps `QueryClientProvider`).
  - Test files: `src/ui/**/*.test.ts*`.

## Testing Specifics
- **Configs:** `jest.browser.ts` (UI) and `jest.node.ts` (Server).
- **UI Utils:** Located in `src/ui/test-utils/` (aliased as `test-utils` in Jest).
- **Mocks:**
  - Use `jest.mock` with `__esModule: true`.
  - Prefix mock variables with `mock` (e.g., `mockUpdate`).
  - Remember Jest hoists `jest.mock()` calls.

## Key Files
- `src/server/app.module.ts`: Main backend module.
- `src/ui/routeTree.gen.ts`: Generated routes.
- `src/ui/experience/hooks/useExperience.ts`: Example data fetching hook.
- `src/server/modules/experience/experience.controller.ts`: Example controller.
