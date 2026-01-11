---
name: testing-workflow
description: Guide for running and writing tests according to project standards (Server Unit/Integration, UI Integration).
---

# Testing Workflow

Use this skill when you need to run tests, debug failures, or write new tests for the `profile` project.

## 1. Running Tests

This project distinguishes between Server and UI tests.

### Server Tests

Run all server tests (Unit + Integration):

```bash
npm run test:server
```

- **Scope**: `src/server/**/*.test.ts`
- **Environment**: Node.js (`jest.node.ts`)

### UI Tests

Run all UI tests:

```bash
npm run test:ui
```

- **Scope**: `src/ui/**/*.test.tsx`
- **Environment**: jsdom (`jest.browser.ts`)

## 2. Writing Server Tests (`src/server`)

### Unit Tests

- **Pattern**: Manual Dependency Injection.
- **Do not use**: `Test.createTestingModule` (too slow for unit tests).
- **Example**:
  ```typescript
  // service.spec.ts
  const mockRepo = { find: jest.fn() } as any;
  const service = new MyService(mockRepo);
  ```

### Integration Tests

- **Pattern**: NestJS Testing Module with In-Memory SQLite.
- **File suffix**: `.integration.test.ts`
- **Example**: See `src/server/modules/experience/experience.integration.test.ts`.

## 3. Writing UI Tests (`src/ui`)

- **Strategy**: Container-level integration tests. Avoid testing leaf components in isolation unless they are shared library components.
- **Rendering**: ALWAYS use `render` from `test-utils` (wraps QueryClient).
- **Mocking**:
  - Mock network requests by mocking `axios` (or the specific data fetching function).
  - Do not mock internal hooks if possible; test the user flow.

## 4. Debugging

If a test fails, use the VS Code Test Explorer or run the specific file:

```bash
npx jest src/ui/path/to/test.test.tsx --config jest.browser.ts
```
