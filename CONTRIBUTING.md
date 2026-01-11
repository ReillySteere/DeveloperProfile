# Contributing Guide

Welcome to the project! This guide will help you get started with contributing to the codebase.

## Development Workflow

1.  **Strict Monorepo:** We work on both Frontend (`src/ui`) and Backend (`src/server`) in the same repo.
2.  **Branching:** Use descriptive feature branches (e.g., `feature/add-blog-search`).
3.  **Commits:** Write clear, concise commit messages.

## Git Hooks

We use **Husky** to enforce quality standards. A `pre-push` hook runs automatically when you push to the remote repository.

It validates:
1.  **Tests passes** (`npm run test`)
2.  **Linting passes** (`npm run lint`)
3.  **Formatting is correct** (`npm run check-format`)
4.  **Dependency rules are respected** (`npm run depcruise:verify`)

**Tip:** If you need to bypass this for WIP branches (not recommended), use `git push --no-verify`.

## Code Style

- **Linting:** We use ESLint and Prettier.
  ```bash
  npm run lint
  npm run format
  ```
- **Structure:**
  - **UI:** Feature-based folder structure (`src/ui/<feature>`).
  - **Server:** Modular (NestJS Modules).
- **Naming:**
  - Components: PascalCase (`MyComponent.tsx`).
  - Hooks: camelCase (`useHook.ts`).
  - Files: kebab-case (`my-component.tsx`).

## Testing Standards

- **Coverage:** We require **100% test coverage** for all files.
- **Tools:** Jest is used for both environments.
  - `npm run test:ui` (Browser/JSDOM)
  - `npm run test:server` (Node)
- **Integration over Unit:**
  - **Frontend:** Focus on **Intergration Tests** at the _Container_ level (`src/ui/containers/feature/*.container.test.tsx`). These should test the full user flow (render -> interact -> API call mocked -> update UI).
  - **Backend:** Use NestJS `Test.createTestingModule` for integration tests.

## Authentication

- **Frontend:**
  - **Do NOT** manually add `Authorization` headers to Axios requests in hooks.
  - The global `AuthInterceptor` automatically injects the token for all requests if the user is logged in.
  - If you are writing a new hook, just call `axios.get('/api/...')`.

## Developer Tools

- **Architecture:** Check the `architecture/` folder for ADRs and component docs.
- **AI Instructions:** See `.github/copilot-instructions.md` for the prompts and rules we use with AI assistants.

## Deployment

- The application is a single monorepo deployable.
- **Build:** `npm run build` produces the `dist/` folder.
- **Production Run:** `npm run start:server:prod` serves the API and static frontend assets.
