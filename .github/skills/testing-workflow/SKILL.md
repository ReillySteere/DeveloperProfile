---
name: testing-workflow
description: Guide for running and writing tests according to project standards (Server Unit/Integration, UI Integration, E2E).
---

# Testing Workflow

Use this skill when you need to run tests, debug failures, or write new tests for the `profile` project.

## 1. Running Tests

This project has three testing layers: Server (unit/integration), UI (integration), and E2E (Playwright).

### VS Code Tasks (Recommended)

Use VS Code tasks for reliable test execution:

| Task ID            | Description                 |
| ------------------ | --------------------------- |
| `npm: test:all`    | Run all tests (server + UI) |
| `npm: test:server` | Run server tests only       |
| `npm: test:ui`     | Run UI tests only           |

### Terminal Commands

```bash
# Run all unit/integration tests
npm test

# Run server tests only
npm run test:server

# Run UI tests only
npm run test:ui

# Run E2E tests (requires dev server running)
npm run test:e2e

# Run E2E tests with visible browser
npm run test:e2e:headed

# Run E2E tests with interactive UI
npm run test:e2e:ui
```

### Server Tests

- **Scope**: `src/server/**/*.test.ts`
- **Environment**: Node.js (`jest.node.ts`)
- **Transformer**: `@swc/jest`

### UI Tests

- **Scope**: `src/ui/**/*.test.tsx`
- **Environment**: jsdom (`jest.browser.ts`)
- **Transformer**: `@swc/jest`

## 2. Writing Server Tests (`src/server`)

### Unit Tests

- **Pattern**: Manual Dependency Injection.
- **Do not use**: `Test.createTestingModule` (too slow for unit tests).

#### Example: Unit Test with Manual DI

```typescript
// blog.service.test.ts
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BlogService } from './blog.service';
import { BlogPost } from './blog.entity';

describe('BlogService', () => {
  let service: BlogService;
  let mockRepository: jest.Mocked<Repository<BlogPost>>;

  beforeEach(() => {
    // Create mock with jest.fn() for each method
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    // Manual injection - no Test.createTestingModule
    service = new BlogService(mockRepository);
  });

  it('should return all posts', async () => {
    const mockPosts = [{ id: '1', title: 'Test' }];
    mockRepository.find.mockResolvedValue(mockPosts);

    const result = await service.findAll();

    expect(result).toEqual(mockPosts);
    expect(mockRepository.find).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when post not found', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(service.findBySlug('missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
```

### Integration Tests

- **Pattern**: NestJS Testing Module with In-Memory SQLite.
- **File suffix**: `.integration.test.ts`

#### Example: Integration Test with In-Memory DB

```typescript
// blog.integration.test.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { BlogModule } from './blog.module';
import { BlogPost } from './blog.entity';

describe('BlogModule (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [BlogPost],
          synchronize: true,
        }),
        BlogModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/blog returns empty array initially', () => {
    return request(app.getHttpServer()).get('/api/blog').expect(200).expect([]);
  });

  it('POST /api/blog creates a new post', () => {
    return request(app.getHttpServer())
      .post('/api/blog')
      .send({ title: 'New Post', slug: 'new-post', content: 'Content' })
      .expect(201);
  });
});
```

## 3. Writing UI Tests (`src/ui`)

- **Strategy**: Container-level integration tests. Avoid testing leaf components in isolation unless they are shared library components.
- **Rendering**: ALWAYS use `render` from `ui/test-utils` (wraps QueryClient).
- **Mocking**:
  - Mock network requests by mocking `axios`.
  - Mock **global state hooks** (like `useAuth`) when needed to control auth state.
  - Do **not** mock feature-specific data hooks (like `useBlog`); let them execute and mock `axios` instead.

### Example: UI Container Integration Test

```typescript
// blog.container.test.tsx
import { render, screen, waitFor } from 'ui/test-utils';
import axios from 'axios';
import { useAuth } from 'ui/shared/hooks/useAuth';
import { BlogContainer } from './blog.container';

// Mock axios at module level
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock auth hook (global state, not feature-specific)
jest.mock('ui/shared/hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock ESM libraries that cause issues
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

describe('BlogContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: false, token: null });
  });

  it('should display loading state initially', () => {
    mockAxios.get.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<BlogContainer />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display blog posts after loading', async () => {
    mockAxios.get.mockResolvedValue({
      data: [
        { id: '1', title: 'First Post', slug: 'first-post' },
        { id: '2', title: 'Second Post', slug: 'second-post' },
      ],
    });

    render(<BlogContainer />);

    await waitFor(() => {
      expect(screen.getByText('First Post')).toBeInTheDocument();
      expect(screen.getByText('Second Post')).toBeInTheDocument();
    });
  });

  it('should display error state when API fails', async () => {
    mockAxios.get.mockRejectedValue(new Error('Network error'));

    render(<BlogContainer />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no posts exist', async () => {
    mockAxios.get.mockResolvedValue({ data: [] });

    render(<BlogContainer />);

    await waitFor(() => {
      expect(screen.getByText(/no posts/i)).toBeInTheDocument();
    });
  });
});
```

### Example: Testing User Interactions

```typescript
import { render, screen, waitFor } from 'ui/test-utils';
import userEvent from '@testing-library/user-event';

it('should create a new post when form is submitted', async () => {
  const user = userEvent.setup();
  mockAxios.get.mockResolvedValue({ data: [] });
  mockAxios.post.mockResolvedValue({ data: { id: '1', title: 'New Post' } });

  render(<CreateBlogPostContainer />);

  await user.type(screen.getByLabelText('Title'), 'New Post');
  await user.type(screen.getByLabelText('Content'), 'Post content');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(mockAxios.post).toHaveBeenCalledWith('/api/blog', {
      title: 'New Post',
      content: 'Post content',
    });
  });
});
```

## 4. Test Utilities

### UI Test Utils (`src/ui/test-utils`)

- Provides wrapped `render` function with `QueryClientProvider`
- Import as: `import { render, screen } from 'ui/test-utils';`

### Server Test Utils (`src/server/test-utils`)

- Provides Jest preloaded configuration for Node environment
- Used internally by `jest.node.ts`

## 5. E2E Testing (Playwright)

E2E tests use Playwright with Chromium to test full user workflows. Tests are located in the `e2e/` directory.

### Running E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with visible browser for debugging
npm run test:e2e:headed

# Run with interactive UI for debugging
npm run test:e2e:ui
```

### E2E Test Structure

```
e2e/
├── about.spec.ts       # About page tests
├── blog.spec.ts        # Blog functionality tests (including auth)
├── experience.spec.ts  # Experience page tests
├── projects.spec.ts    # Projects page tests
└── theme.spec.ts       # Theme toggle tests
```

### Writing E2E Tests

```typescript
// e2e/example.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should perform action', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Expected Title');
  });
});
```

**Verification:** After creating or modifying any `.spec.ts` file, you **MUST** run the E2E tests locally (`npm run test:e2e`) to verify your changes work as expected.

### Authentication in E2E Tests

For tests requiring authentication, use the demo credentials:

```typescript
test('authenticated workflow', async ({ page }) => {
  await page.goto('/');

  // Sign in
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByLabel('Username').fill('demo');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Verify authenticated state
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
});
```

### E2E Tests in CI

E2E tests run automatically in GitHub Actions after unit/integration tests pass. Failed E2E tests will block PR merges. Test artifacts (screenshots, traces) are uploaded for debugging.

## 6. Debugging

If a test fails, use the VS Code Test Explorer or run the specific file:

```bash
# Jest tests
npx jest src/ui/path/to/test.test.tsx --config jest.browser.ts

# Playwright tests
npx playwright test e2e/about.spec.ts --headed
```

## 7. Pre-push Checks

The project enforces quality checks via Husky hooks. Before pushing, the following commands are run:

- `npm run type-check`: Ensures no TypeScript errors (`tsc --noEmit`).
- `npm run depcruise:verify`: Ensures strict dependency boundaries.
