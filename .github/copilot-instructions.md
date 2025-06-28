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

## Repository Structure

checkout/
├── .github/
│ └── copilot-instructions.md
├── .vscode/
│ └── launch.json
├── .adr-dir/
├── .eslintcache
├── .eslintrc.js
├── .gitlab-ci.yml
├── .lintstagedrc.js
├── .npmignore
├── .prettierignore
├── .stylelintignore
├── .stylelintrc.js
├── .yarnrc
├── babel.config.js
├── Dockerfile
├── jest.browser.ts
├── jest.node.ts
├── jest.setup.ts
├── package.json
├── postcss.config.js
├── README.md
├── tsconfig.jest.json
├── tsconfig.json
├── yarn-error.log
├── config/
├── coverage/
├── deploy/
├── doc/
├── eslint-local-rules/
├── public/
├── src/
│ ├── assets/
│ ├── contexts/
│ ├── react/
│ │ ├── **mocks**/
│ │ ├── components/
│ │ ├── constants/
│ │ ├── cookies/
│ │ ├── formatting/
│ │ ├── hooks/
│ │ ├── pages/
│ │ ├── providers/
│ │ ├── router/
│ │ ├── services/
│ │ ├── store/
│ │ ├── test-utils/
│ │ ├── types/
│ │ ├── utils/
│ ├── shared/
│ │ ├── constants/
│ │ ├── errors/
│ │ ├── mocks/
│ │ ├── models/
│ │ ├── orderMailer/
│ │ ├── schemas/
│ │ └── types/
│ ├── server/
│ │ ├── **mocks**/
│ │ ├── constants/
│ │ ├── controllers/
│ │ ├── cookies/
│ │ ├── decorators/
│ │ ├── errors/
│ │ ├── filters/
│ │ ├── guards/
│ │ ├── helpers/
│ │ ├── interceptors/
│ │ ├── lib/
│ │ ├── models/
│ │ ├── modules/
│ │ ├── service-client/
│ │ ├── services/
│ │ ├── test-utils/
│ │ └── viewModels/

## Project Dependencies

This section lists all dependencies currently in use by the checkout project.

### Dependencies

- @hookform/devtools: ~4.3.1
- @kount/kount-web-client-sdk: ~2.2.2
- @nestjs-modules/mailer: 2.0.2
- @nestjs/common: ~10.2.2
- @nestjs/core: ~10.2.2
- @nestjs/platform-express: ~10.2.2
- @nestjs/serve-static: ~4.0.0
- @tanstack/react-query: ~5.48.0
- @tanstack/react-query-devtools: ~5.48.0
- @types/googlepay: ~0.7.6
- @unisporkal/alliance-ui-button: ~1.0.0
- @unisporkal/alliance-ui-checkbox: ~1.0.0
- @unisporkal/alliance-ui-dropdown-menu: ~1.0.0
- @unisporkal/alliance-ui-flex-box: ~1.0.0
- @unisporkal/alliance-ui-form: ~1.0.0
- @unisporkal/alliance-ui-icon-button: ~1.0.0
- @unisporkal/alliance-ui-icons: ~1.0.0
- @unisporkal/alliance-ui-image: ~1.0.0
- @unisporkal/alliance-ui-link: ~1.0.0
- @unisporkal/alliance-ui-modal: ~1.0.0
- @unisporkal/alliance-ui-radio-button: ~1.0.0
- @unisporkal/alliance-ui-radio-button-group: ~1.0.0
- @unisporkal/alliance-ui-select: ~1.0.0
- @unisporkal/alliance-ui-spinner: ~1.0.0
- @unisporkal/alliance-ui-tooltip: ~1.0.0
- @unisporkal/alliance-ui-typography: ~1.0.0
- @unisporkal/authentication: ~1.0.0
- @unisporkal/babel-plugin-lazy-component: ~1.0.0
- @unisporkal/browser: ~1.0.0
- @unisporkal/consul-client: ~1.0.0
- @unisporkal/cookie-cutter: ~1.0.0
- @unisporkal/customer-profile: ~1.0.0
- @unisporkal/experiences: ~1.0.0
- @unisporkal/federation: ~1.0.0
- @unisporkal/ga4: ~1.0.0
- @unisporkal/instrumentation: ~1.0.0
- @unisporkal/localization: ~1.0.0
- @unisporkal/nestjs-core: ~1.0.0
- @unisporkal/nestjs-customer-profile: ~1.0.0
- @unisporkal/nestjs-federation: ~1.0.0
- @unisporkal/nestjs-mailer: ~1.0.0
- @unisporkal/react-instrumentation: ~1.0.0
- @unisporkal/react-lazy-component: ~1.0.0
- @unisporkal/service-client: ~1.0.0
- @unisporkal/sites: ~1.0.0
- @unisporkal/tooltip: ~1.0.0
- @unisporkal/tracking: ~1.0.0
- @unisporkal/unisporkal-styles: ~1.0.0
- @unisporkal/utilities: ~1.0.0
- axios: ~1.1.3
- class-transformer: ~0.5.1
- class-validator: ~0.14.0
- classnames: ~2.3.1
- concurrently: ~6.3.0
- express: ~4.18.2
- frames-react: ~1.1.2
- ibantools: ~4.5.1
- intl-tel-input: ~23.0.8
- nodemailer: ^6.10.0
- pretty-bytes: ~6.1.1
- react: ~18.2.0
- react-dom: ~18.2.0
- react-google-recaptcha: ~2.1.0
- react-hook-form: ~7.53.0
- react-loader-spinner: ~4.0.0
- react-router: ~6.21.0
- react-router-dom: ~6.21.0
- reflect-metadata: ~0.1.13
- rxjs: ~7.8.1
- sanitize-html: ~2.4.0
- ts-jest: ~29.1.2
- uuid: ~9.0.0
- zod: ~3.24.2

### Dev Dependencies

- @babel/eslint-parser: ~7.17.0
- @module-federation/enhanced: 0.6.10
- @nestjs/testing: ~10.2.2
- @testing-library/dom: ~10.1.0
- @testing-library/jest-dom: ~5.16.4
- @testing-library/react: ~16.0.0
- @testing-library/react-hooks: ~8.0.0
- @testing-library/user-event: ~14.5.2
- @types/applepayjs: ^14.0.9
- @types/eslint: ~9.6.1
- @types/jest: ~29.5.12
- @types/nodemailer: ^6.4.17
- @types/react: ~18.2.24
- @types/spreedly-iframe-browser: ~1.0.3
- @types/webpack-env: ~1.18.0
- @unisporkal/babel-preset-unisporkal: ~1.0.0
- @unisporkal/instrumentation: ~1.0.0
- @unisporkal/linting: ~1.0.0
- @unisporkal/webpack-config: ~1.0.0
- babel-eslint: ~10.1.0
- babel-jest: ~29.7.0
- circular-dependency-plugin: ~5.2.2
- eslint: ~8.50.0
- eslint-plugin-local-rules: ~3.0.2
- eslint-plugin-react-compiler: ^19.0.0-beta-6fc168f-20241025
- husky: ~9.0.11
- identity-obj-proxy: ~3.0.0
- jest: ~29.7.0
- jest-environment-jsdom: ~29.7.0
- jest-fixed-jsdom: ^0.0.9
- jest-mock: ~29.7.0
- lint-staged: ~15.2.2
- msw: ~2.7.1
- prettier: ~2.8.3
- stylelint: ~15.10.0
- ts-node: ~10.9.2
- typescript: ~5.2.2
