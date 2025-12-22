# COPILOT INSTRUCTIONS

## Architecture Overview

This is a **full-stack TypeScript monorepo** with separate NestJS backend and React frontend, using:

- **Backend:** NestJS + TypeORM + SQLite (in `src/server/`)
- **Frontend:** React 19 + TanStack Router + TanStack Query + Zustand (in `src/ui/`)
- **Shared:** Common types in `src/shared/types/`
- **Path Aliases:** `ui/*`, `shared/*`, `backend/*` configured in tsconfig.json
- **Dual Build System:** Webpack (UI) + NestJS CLI (server)
- **Dual Test Configs:** `jest.browser.ts` (UI) and `jest.node.ts` (server) with separate coverage requirements (100% for both)

**Key Integration Pattern:** React Query hooks (e.g., `useExperiences` in [src/ui/react/components/ExperiencePage/useExperience.ts](src/ui/react/components/ExperiencePage/useExperience.ts)) fetch from NestJS controllers (e.g., `ExperienceController` in [src/server/modules/experience.controller.ts](src/server/modules/experience.controller.ts)) via Axios.

## Development Workflow

**Critical Commands:**

- `npm start` - Runs BOTH UI (webpack-dev-server on port 8080) and server (NestJS on port 3000) concurrently
- `npm run build` - Builds server then UI into `dist/`
- `npm run test` - Runs BOTH test suites (`test:server` + `test:ui`) with 100% coverage requirement
- `npm run lint` - ESLint with Prettier integration, includes React Compiler plugin

**Testing Specifics:**

- UI tests use `@testing-library/react` imported from `ui/react/test-utils` (provides QueryClient wrapper)
- Server tests use manual dependency injection (see [src/server/auth/auth.service.test.ts](src/server/auth/auth.service.test.ts))
- Both require 100% coverage (statements, branches, functions, lines)
- Test files must match patterns: `src/ui/**/*.test.ts*` or `src/server/**/*.test.ts`

## Code Generation Requirements

**Workflow Rules:**

- Edit ONE file at a time to prevent corruption
- For files >300 lines or complex refactors, create a detailed plan first with function list, dependencies, and change order
- Always propose execution plan for significant tasks and request confirmation
- If new requirements surface during edits, revise plan and get approval before proceeding

**Before/After Protocol:**

- Include clear before/after code snippets when proposing changes
- Provide concise explanations of what changed and why

## NestJS Backend Patterns

**Module Structure:**

- Controllers handle HTTP requests with `@Controller` decorators (e.g., `@Controller('api/experience')`)
- Services contain business logic with `@Injectable` decorators
- Modules wire dependencies together (see [src/server/app.module.ts](src/server/app.module.ts))
- JWT authentication via Passport using `JwtAuthGuard` and `JwtStrategy` (see [src/server/auth/](src/server/auth/))

**Key Setup Details:**

- Swagger API docs configured at `/api/docs` in [src/server/main.ts](src/server/main.ts)
- Global ValidationPipe with `whitelist: true, forbidNonWhitelisted: true`
- Sentry exception filter applied globally
- CORS enabled for local development

**Environment Variables:**

- `JWT_AUTH_SECRET` - Secret key for signing JWT tokens (defaults to 'defaultSecretKey' if not set)
- `SENTRY_DSN` - Data Source Name for Sentry error tracking

**Database & Entities:**

- Database: SQLite (via TypeORM)
- Entities: Currently no entities defined. Initial data seeding will be based on hardcoded data in `ExperienceController`.
- Future Workflow: Create entities in `src/server/modules/` matching `ExperienceEntry` type, then update controller to fetch from DB.

## React Frontend Patterns

**Routing & State:**

- TanStack Router with file-based routing (generated `routeTree.gen.ts` - DO NOT edit manually)
- Zustand store for global state (e.g., `navStore` with persist middleware - see [src/ui/stores/navStore.ts](src/ui/stores/navStore.ts))
- TanStack Query for server state (all API calls go through custom hooks like `useExperiences`)

**Styling:**

- SCSS modules with CSS Modules naming: `[name]__[local]___[hash:base64:5]`
- Dark/light theme via `data-theme` attribute on `<html>` (controlled by navStore)

**Key Libraries:**

- React Compiler plugin enabled (enforced by ESLint)
- Framer Motion for animations
- Lucide React for icons
- Sentry browser integration

## Testing Requirements

**Coverage:** 100% for statements, branches, functions, lines (enforced in both configs)

**UI Testing Patterns:**

- Import `render` from `ui/react/test-utils` (wraps with QueryClient provider)
- Use `@testing-library/react` methods
- Prefix unused variables with underscore
- Destructure props in mock components

**Server Testing Patterns:**

- Manual dependency injection (no `@nestjs/testing` module setup in examples)
- Mock dependencies like `JwtService` using Jest mocks
- Follow `describe` > `it` structure

**Mock Conventions:**

- Add `__esModule: true` ONLY in `jest.mock` factory functions
- Prefix mock variables with `mock` when referenced inside `jest.mock()` (e.g., `mockUpdateSubmissionData`)
- Remember Jest hoists `jest.mock()` calls - wrap variable references in functions to delay evaluation

**Event Handlers:** Simulate all event handlers and assert state changes

## Pre-Commit Checklist

1. Run `npm run lint` (must pass with no errors)
2. Run `npm run test` (must achieve 100% coverage)
3. Update README.md if adding new functionality
4. Verify directory structure documentation in this file matches reality

## Error Handling

**Server-Side:**

- Use NestJS built-in exceptions (e.g., `BadRequestException`, `UnauthorizedException`)
- Global `SentryExceptionFilter` captures all unhandled errors (see [src/server/sentry-exception.filter.ts](src/server/sentry-exception.filter.ts))
- Use `ErrorMessage` utility for extracting error messages safely (see [src/server/util/ErrorMessage.ts](src/server/util/ErrorMessage.ts))

**Client-Side:**

- TanStack Query handles error states automatically (use `isError` from hooks)
- Sentry browser integration captures unhandled errors
- Ensure error messages are clear and actionable without exposing sensitive information

## Performance Optimization

- React Compiler plugin automatically optimizes memoization (avoid manual `useMemo`/`useCallback` unless profiled)
- TanStack Query provides intelligent caching (configure `staleTime` per-query, see `useExperiences` for example)
- Use lazy loading for routes when appropriate
- CSS Modules enable tree-shaking of unused styles

## Accessibility Standards

- Use semantic HTML (`<header>`, `<main>`, `<footer>`)
- Include ARIA attributes where necessary
- Test keyboard navigation for all interactive elements
- Ensure sufficient color contrast (theme system supports light/dark modes)

## Path Aliases & Module Resolution

**TypeScript Paths (tsconfig.json):**

- `ui/*` → `src/ui/*`
- `shared/*` → `src/shared/*`
- `backend/*` → `src/server/*`

**Webpack Aliases (webpack.browser.js):**

- `ui` → `src/ui`
- `shared` → `src/shared`

**Jest Module Mappers:**

- UI tests: `^ui/(.*)$` → `<rootDir>/src/ui/$1`
- Server tests: `^backend/(.*)$` → `<rootDir>/src/server/$1`

**Import Convention:** Always use path aliases, never relative paths for cross-domain imports (e.g., `import { ExperienceEntry } from 'shared/types'`)

## Directory Structure

The project directory structure is as follows:

```
profile/
    cypress.config.ts
    eslint.config.js
    jest.browser.ts
    jest.node.ts
    jest.setup.ts
    LICENSE
    package.json
    README.md
    tsconfig.cypress.json
    tsconfig.jest.json
    tsconfig.json
    webpack.browser.js
    webpack.server.js
    cypress/
        e2e/
            app.spec.cy.ts
        fixtures/
            example.json
        support/
            commands.ts
            e2e.ts
    data/
        database.sqlite
    public/
        index.html
    src/
        server/
            app.controller.test.ts
            app.controller.ts
            app.module.ts
            app.service.ts
            main.ts
            sentry-exception.filter.test.ts
            sentry-exception.filter.ts
            auth/
            modules/
            test-utils/
            util/
        shared/
            types/
        ui/
            index.tsx
            routeTree.gen.ts
            api/
            react/
                components/
                containers/
                test-utils/
            routes/
            stores/
```

## Project Dependencies

This section lists all dependencies currently in use by the checkout project.

### Dependencies

- "@nestjs/common": "^11.0.1",
- "@nestjs/core": "^11.0.1",
- "@nestjs/jwt": "^11.0.0",
- "@nestjs/passport": "^11.0.5",
- "@nestjs/platform-express": "^11.0.1",
- "@nestjs/swagger": "^11.1.1",
- "@nestjs/typeorm": "^11.0.0",
- "@sentry/integrations": "^7.114.0",
- "@sentry/node": "^9.11.0",
- "@sentry/react": "^9.10.1",
- "@sentry/tracing": "^7.120.3",
- "@sentry/webpack-plugin": "^3.2.4",
- "@tanstack/react-query": "^5.71.0",
- "class-transformer": "^0.5.1",
- "class-validator": "^0.14.1",
- "passport": "^0.7.0",
- "passport-jwt": "^4.0.1",
- "react": "^19.1.0",
- "react-dom": "^19.1.0",
- "react-transition-group": "^4.4.5",
- "reflect-metadata": "^0.2.2",
- "rxjs": "^7.8.1",
- "sqlite3": "^5.1.7",
- "swagger-ui-express": "^5.0.1",
- "typeorm": "^0.3.22",
- "zustand": "^5.0.3"

### Dev Dependencies

- "@babel/core": "^7.26.10",
- "@babel/preset-env": "^7.26.9",
- "@babel/preset-react": "^7.26.3",
- "@babel/preset-typescript": "^7.27.0",
- "@eslint/eslintrc": "^3.2.0",
- "@eslint/js": "^9.18.0",
- "@nestjs/cli": "^11.0.0",
- "@nestjs/schematics": "^11.0.0",
- "@nestjs/testing": "^11.0.1",
- "@swc/cli": "^0.6.0",
- "@swc/core": "^1.10.7",
- "@testing-library/jest-dom": "^6.6.3",
- "@testing-library/react": "^16.2.0",
- "@types/express": "^5.0.0",
- "@types/jest": "^29.5.14",
- "@types/node": "^22.13.14",
- "@types/passport-jwt": "^4.0.1",
- "@types/react": "^19.0.12",
- "@types/react-dom": "^19.0.4",
- "@types/react-transition-group": "^4.4.12",
- "@types/supertest": "^6.0.2",
- "@typescript-eslint/eslint-plugin": "^8.28.0",
- "@typescript-eslint/parser": "^8.28.0",
- "babel-loader": "^10.0.0",
- "babel-plugin-react-compiler": "^19.0.0-beta-ebf51a3-20250411",
- "concurrently": "^7.0.0",
- "cross-env": "^7.0.3",
- "css-loader": "^7.1.2",
- "cypress": "^14.2.1",
- "eslint": "^9.23.0",
- "eslint-config-prettier": "^10.1.1",
- "eslint-plugin-prettier": "^5.2.5",
- "eslint-plugin-react-compiler": "^19.0.0-beta-ebf51a3-20250411",
- "globals": "^16.0.0",
- "identity-obj-proxy": "^3.0.0",
- "jest": "^29.7.0",
- "jest-environment-jsdom": "^29.7.0",
- "jest-fetch-mock": "^3.0.3",
- "jest-fixed-jsdom": "^0.0.9",
- "prettier": "^3.5.3",
- "sass": "^1.86.0",
- "sass-loader": "^16.0.5",
- "source-map-support": "^0.5.21",
- "style-loader": "^4.0.0",
- "supertest": "^7.0.0",
- "ts-jest": "^29.3.0",
- "ts-loader": "^9.5.2",
- "ts-node": "^10.9.2",
- "tsconfig-paths": "^4.2.0",
- "typescript": "^5.8.2",
- "typescript-eslint": "^8.20.0",
- "webpack": "^5.98.0",
- "webpack-cli": "^6.0.1",
- "webpack-dev-server": "^5.2.1-
