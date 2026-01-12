# Contributing Guide

Welcome to the project! This guide will help you get started with contributing to the codebase.

## Development Workflow

1.  **Strict Monorepo:** We work on both Frontend (`src/ui`) and Backend (`src/server`) in the same repo.
2.  **Branching:** Use descriptive feature branches (e.g., `feature/add-blog-search`).
3.  **Commits:** Write clear, concise commit messages.

## Editor Setup

We highly recommend using **Visual Studio Code** for this project. This workspace comes pre-configured with:

1.  **Recommended Extensions:** Upon opening, accept the prompt to install ESLint, Prettier, Jest, and Dependency Cruiser extensions.
2.  **Workspace Settings:** Ensures consistent formatting and linting behavior across the team.

## Quality Gates

We use both local Git hooks and cloud-based CI to enforce quality.

### Local (Husky)

We use **Husky** to enforce quality standards. A `pre-push` hook runs automatically when you push to the remote repository.

It validates:

1.  **Tests passes** (`npm run test`)
2.  **Linting passes** (`npm run lint`)
3.  **Formatting is correct** (`npm run check-format`)
4.  **Dependency rules are respected** (`npm run depcruise:verify`)

**Tip:** If you need to bypass this for WIP branches (not recommended), use `git push --no-verify`.

### Continuous Integration (GitHub Actions)

The pipeline defined in `.github/workflows/ci.yml` runs the same checks on every Push and Pull Request to ensure the build remains stable across environments.

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

## Feature Scaffolding

To quickly start a new feature that follows our architectural standards (BFF pattern, Modular Monolith), use the scaffold command:

\`\`\`bash
npm run scaffold <feature-name>
\`\`\`

This will generate:

- **Server:** Module, Controller, Service, and Unit Tests in \`src/server/modules/<feature>\`.
- **UI:** Container, Hook, and Integration Tests in \`src/ui/containers/<feature>\`.
- **Shared:** Types in \`src/shared/types\`.

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
