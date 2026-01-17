---
name: error-handling
description: Debug and resolve common errors in TypeScript, Jest tests, ESLint, and dependency validation.
---

# Error Handling

Use this skill when you encounter errors during development, testing, or build processes.

## 1. TypeScript Errors

### Common Errors and Fixes

| Error Code | Meaning                 | Fix                                                     |
| ---------- | ----------------------- | ------------------------------------------------------- |
| `TS2307`   | Cannot find module      | Check path alias in `tsconfig.json`, verify file exists |
| `TS2339`   | Property does not exist | Add property to interface, check for typos              |
| `TS2345`   | Argument type mismatch  | Cast with `as`, fix the type, or update interface       |
| `TS7006`   | Implicit any            | Add explicit type annotation                            |
| `TS2322`   | Type not assignable     | Check for `null`/`undefined`, use optional chaining     |

### Debugging Workflow

1. Run `npm run type-check` to see all errors.
2. Focus on the **first** error (later errors are often cascading).
3. Check if the error is in your code or a library type definition.

### Example: Fixing TS2307

**Error:**

```
error TS2307: Cannot find module 'shared/types/blog' or its corresponding type declarations.
```

**Diagnosis:** Path alias not resolving.

**Fix:** Verify `tsconfig.json` has the alias:

```json
"paths": {
  "shared/*": ["src/shared/*"]
}
```

## 2. Jest Test Failures

### Project Test Configuration

This project uses a unified Jest entrypoint that runs both environments:

```bash
# Run ALL tests (recommended)
npm test

# Run only UI tests
npm run test:ui

# Run only Server tests
npm run test:server
```

The unified config (`jest.config.ts`) delegates to:

- `jest.browser.ts` → UI tests (`src/ui/**/*.test.tsx`) in jsdom environment
- `jest.node.ts` → Server tests (`src/server/**/*.test.ts`, `src/shared/**/*.test.ts`) in Node environment

### Common Patterns (Both Environments)

| Symptom                          | Likely Cause                      | Fix                                     |
| -------------------------------- | --------------------------------- | --------------------------------------- |
| "Cannot find module"             | Missing path alias or mock        | Check `moduleNameMapper` in jest config |
| "TypeError: X is not a function" | Mock not returning expected shape | Verify mock implementation              |
| Timeout errors                   | Async not awaited                 | Add `await` or increase timeout         |

### UI-Specific Issues (jest.browser.ts)

| Symptom                          | Likely Cause               | Fix                                                |
| -------------------------------- | -------------------------- | -------------------------------------------------- |
| "act() warning"                  | State update after unmount | Wrap in `await waitFor()`                          |
| "SyntaxError: Cannot use import" | ESM library not transpiled | Mock the module (see example below)                |
| "document is not defined"        | Wrong test environment     | Ensure file matches `src/ui/**/*.test.tsx` pattern |

### Server-Specific Issues (jest.node.ts)

| Symptom                           | Likely Cause                    | Fix                                                        |
| --------------------------------- | ------------------------------- | ---------------------------------------------------------- |
| "Nest can't resolve dependencies" | Missing provider in test module | Add provider or mock to `Test.createTestingModule`         |
| "EntityMetadataNotFoundError"     | Entity not registered           | Add entity to `TypeOrmModule.forRoot({ entities: [...] })` |
| Database state leaking            | Tests not isolated              | Use `:memory:` SQLite and `synchronize: true`              |

### Debugging Workflow

1. Run the single failing test with verbose output:

   **For UI tests:**

   ```bash
   npx jest src/ui/path/to/test.test.tsx --config jest.browser.ts --verbose
   ```

   **For Server tests:**

   ```bash
   npx jest src/server/path/to/test.test.ts --config jest.node.ts --verbose
   ```

2. Check if the mock is set up correctly.
3. Verify `beforeEach`/`afterEach` cleanup.

### Example: Fixing ESM Mock Issues (UI)

**Error:**

```
SyntaxError: Cannot use import statement outside a module
```

**Diagnosis:** ESM library not transpiled by Jest.

**Fix:** Add to jest config's `transformIgnorePatterns` or mock the module:

```typescript
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));
```

### Example: Fixing "act()" Warnings (UI)

**Error:**

```
Warning: An update to Component inside a test was not wrapped in act(...)
```

**Fix:** Wrap assertions in `waitFor`:

```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### Example: Fixing NestJS Dependency Resolution (Server)

**Error:**

```
Nest can't resolve dependencies of the BlogService (?). Please make sure that the argument "BlogPostRepository" at index [0] is available in the RootTestModule context.
```

**Fix:** Provide the repository in your test module:

```typescript
const moduleRef = await Test.createTestingModule({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [BlogPost],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([BlogPost]), // ← Register the repository
  ],
  providers: [BlogService],
}).compile();
```

### Example: Fixing Database State Leaking (Server)

**Problem:** Tests pass individually but fail when run together.

**Fix:** Ensure each test uses a fresh in-memory database:

```typescript
beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:', // ← Fresh DB per test suite
        synchronize: true,
        entities: [BlogPost],
      }),
      BlogModule,
    ],
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();
});

afterAll(async () => {
  await app.close(); // ← Always close to release resources
});
```

## 3. ESLint / Prettier Errors

### Quick Fixes

```bash
# Auto-fix all fixable issues
npm run format

# Check without fixing
npm run lint
```

### Common ESLint Errors

| Rule                                 | Context | Fix                                  |
| ------------------------------------ | ------- | ------------------------------------ |
| `@typescript-eslint/no-unused-vars`  | Both    | Remove variable or prefix with `_`   |
| `@typescript-eslint/no-explicit-any` | Both    | Replace `any` with proper type       |
| `prettier/prettier`                  | Both    | Run `npm run format`                 |
| `react-hooks/exhaustive-deps`        | UI      | Add missing dependency to array      |
| `react-hooks/rules-of-hooks`         | UI      | Ensure hooks are called at top level |

### Example: Fixing react-hooks/exhaustive-deps (UI)

**Error:**

```
React Hook useEffect has a missing dependency: 'fetchData'
```

**Fix Options:**

1. Add the dependency (preferred):

   ```typescript
   useEffect(() => {
     fetchData();
   }, [fetchData]);
   ```

2. Use `useCallback` to stabilize the function:
   ```typescript
   const fetchData = useCallback(() => {
     /* ... */
   }, []);
   useEffect(() => {
     fetchData();
   }, [fetchData]);
   ```

## 4. Dependency Cruiser Violations

### Understanding Violations

Run the check:

```bash
npm run depcruise:verify
```

### Common Violations and Fixes

| Violation       | Meaning                      | Fix                              |
| --------------- | ---------------------------- | -------------------------------- |
| `not-to-server` | UI importing from server     | Move shared code to `src/shared` |
| `not-to-ui`     | Server importing from UI     | Move shared code to `src/shared` |
| `no-circular`   | Circular dependency detected | Refactor to break the cycle      |

### Example: Fixing Cross-Boundary Import

**Error:**

```
error no-orphans: src/ui/blog/hooks/useBlog.ts → src/server/modules/blog/blog.entity.ts
```

**Fix:** The UI should not import server entities. Create a shared type:

1. Create `src/shared/types/blog.ts`:

   ```typescript
   export interface BlogPost {
     id: string;
     title: string;
     // ... shared fields
   }
   ```

2. Update UI to import from shared:
   ```typescript
   import { BlogPost } from 'shared/types/blog';
   ```

## 5. Build Errors

### NestJS Build Failures

```bash
npm run build:server
```

| Error                       | Fix                                              |
| --------------------------- | ------------------------------------------------ |
| Decorator metadata errors   | Ensure `emitDecoratorMetadata: true` in tsconfig |
| Circular dependency warning | Use `forwardRef()` or restructure modules        |

### Webpack Build Failures

```bash
npm run build:ui
```

| Error              | Fix                                        |
| ------------------ | ------------------------------------------ |
| Module not found   | Check webpack aliases match tsconfig paths |
| Asset size warning | Consider code splitting or lazy loading    |

## 6. Runtime Errors

### Server Errors (NestJS)

| Error                   | Cause                   | Fix                                 |
| ----------------------- | ----------------------- | ----------------------------------- |
| `EADDRINUSE`            | Port already in use     | Kill process on port or change port |
| `EntityNotFoundError`   | Database record missing | Check ID, handle with try/catch     |
| `UnauthorizedException` | JWT invalid/expired     | Check token, re-authenticate        |

### Client Errors (React)

| Error                               | Cause                      | Fix                          |
| ----------------------------------- | -------------------------- | ---------------------------- |
| "Hydration mismatch"                | SSR/client content differs | Ensure consistent rendering  |
| "Maximum update depth"              | Infinite re-render loop    | Check useEffect dependencies |
| "Cannot read property of undefined" | Null reference             | Add optional chaining `?.`   |

## 7. Escalation

If the error persists after following this guide:

1. Search the error message in project issues.
2. Check if the error is in a third-party library (update or file issue).
3. Ask for help with the full error message and reproduction steps.
