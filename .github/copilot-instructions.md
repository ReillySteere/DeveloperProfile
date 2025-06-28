# COPILOT INSTRUCTIONS

## Code Generation Requirements

- Avoid working on more than one file at a time.
- Multiple simultaneous edits to a file may cause corruption.
- Focus on one conceptual change at a time.
- Adjust or expand in later steps if needed.

- For large files (>300 lines) or complex refactors, ALWAYS start by creating a detailed plan _before_ making any edits.
- The plan should include:

  - A list of all functions or sections that need modification.
  - The order in which changes should be applied.
  - Dependencies between changes.
  - A suggestion to split changes across multiple sessions if needed.

- **Before/After Snippets & Explanations**:

  - Always include clear before and after code snippets when proposing changes.
  - Provide concise explanations of what changed and why.

### Confirmation and Iterative Implementation

- For significant or non-trivial tasks, propose a clear execution plan and request explicit confirmation from the developer.
- If new requirements or issues are discovered during editing, revise the plan and ask for confirmation before proceeding.

### NestJS Backend Considerations

- For backend changes, follow NestJS conventions:
  - Use decorators (e.g., `@Controller`, `@Injectable`) appropriately.
  - Structure code into controllers, services, and modules.
  - Maintain dependency injection patterns.
  - Code should be modular and follow single-responsibility principle

### TypeScript and React Patterns

- Use TypeScript interfaces/types for all props and data structures
- Follow React best practices (hooks, functional components)
- Use proper state management techniques
- Components should be modular and follow single-responsibility principle

### Required Before Each Commit

- Run `yarn run lint` to ensure code follows project standards
- Ensure all tests pass by running `yarn run test` in the terminal
- When adding new functionality, make sure you update the README
- Make sure that the repository structure documentation is correct and accurate in the Copilot Instructions file

## Development Flow

- Install dependencies: `yarn install`
- Development server: `yarn run dev`
- Build: `yarn run build`
- Test: `yarn run jest`
- Lint: `yarn run eslint`

## Testing Requirements

- Ensure the test suite covers every branch, statement, and function.
- Add tests for any new functionality to avoid reducing test coverage.
- Place all tests for a unit within one comprehensive file.
- Organize related tests under appropriate `describe` blocks.
- Write tests in TypeScript (TS Version 5) and use type casting when necessary.
- Use only `import`/`export` (ES module) syntax (do not use `require`).
- For JSX unit testing, use `@testing-library/react` imported from `app/react/test-utils`.
- Use `describe` and `it` blocks consistently to group and name tests clearly.
- Destructure props passed to mock components by default.
- Prefix unused variables with an underscore (\_).
- For mocks:

  - Add `__esModule: true` only to objects created within `jest.mock` factory functions.
  - Use a `mock` prefix when referencing mock variables inside `jest.mock()` (e.g., `mockUpdateSubmissionData`).

### Event Handlers and State Assertions

- Simulate and assert the behavior of all event handlers to confirm they trigger as expected.
- Verify changes to component state and ensure correct responses to mocked external calls.
- Remember that Jest hoists calls to `jest.mock` to the top of the file; if the factory function references later variables, wrap them in a function to delay evaluation.

## Code Review Guidelines

- Ensure code readability by using clear and descriptive variable and function names.
- Maintain code maintainability by adhering to DRY (Don't Repeat Yourself) principles and modular design.
- Follow project conventions for file structure, naming, and formatting.
- Review for potential edge cases and ensure proper handling of unexpected inputs.
- Verify that all new code is covered by tests and that existing tests are not broken.
- When evaluating code, highlight opportunities for extracting logic from the existing code base where there are signs of duplication

## Error Handling

- Use specific error classes to represent different types of errors.
- Log errors consistently using the project's logging framework or utility.
- Ensure that error messages are clear and actionable for debugging purposes.
- Avoid exposing sensitive information in error messages.
- Implement fallback mechanisms where appropriate to handle failures gracefully.

## Performance Optimization

- Avoid unnecessary re-renders in React by using `React.memo`, `useMemo`, and `useCallback` where applicable.
- Minimize the use of heavy computations in the main thread; offload them to web workers or background processes.
- Use lazy loading for components and assets to improve initial load times.
- Profile and monitor performance regularly to identify bottlenecks.

## Accessibility Standards

- Use semantic HTML elements (e.g., `<header>`, `<main>`, `<footer>`) to improve screen reader navigation.
- Include ARIA roles and attributes where necessary to enhance accessibility.
- Test components with screen readers to ensure they are usable by visually impaired users.
- Ensure sufficient color contrast for text and UI elements.
- Provide keyboard navigation support for all interactive elements.

## Clarification & Iterative Feedback

- If there’s any uncertainty about the code changes, file structure, or test implications, ask clarifying questions before proceeding.
- For example, ask if backend-specific guidelines should be applied or if additional instructions on integrating with React Query are needed.

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
            backend.spec.cy.ts
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
            test-utils/
            util/
        shared/
            types/
        ui/
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