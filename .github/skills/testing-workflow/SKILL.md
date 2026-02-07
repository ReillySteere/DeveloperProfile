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

### Coverage Thresholds

Coverage is enforced per test suite with strict thresholds. Tests will fail if coverage drops below these levels.

| Suite  | Statements | Branches | Functions | Lines |
| ------ | ---------- | -------- | --------- | ----- |
| Server | 100%       | 100%     | 100%      | 100%  |
| UI     | 98%        | 92%      | 98%       | 98%   |

**Note:** UI branch coverage is slightly lower (92%) because some defensive branches in library callbacks (e.g., Recharts, SSE handlers) are difficult to exercise without excessive mocking.

## 2. Writing Server Tests (`src/server`)

### Testing Strategy

The backend uses a **hybrid testing approach**:

1. **Integration Tests (Primary):** Test full request flows through controllers with in-memory database.
2. **Unit Tests (When Needed):** Test discrete functions that are difficult to reach via integration tests:
   - Scheduled tasks (`@Cron` handlers)
   - Event handlers (`@OnEvent` decorators)
   - Database maintenance functions
   - Complex business logic with many edge cases

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
- **API Mocking**: Use **MSW (Mock Service Worker)** for network-level API mocking. This is the preferred approach over axios mocks.
- **User Interactions**: Use **@testing-library/user-event** for realistic user interaction simulation.
- **Global State**: Mock **global state hooks** (like `useAuth`) when needed to control auth state.

### MSW Setup (Preferred for API Mocking)

MSW intercepts requests at the network level, providing more realistic testing:

```typescript
// Using MSW handlers from test-utils
import { render, screen, waitFor, userEvent } from 'ui/test-utils';
import { server, createBlogHandlers } from 'ui/test-utils/msw';

describe('BlogContainer', () => {
  it('should display blog posts after loading', async () => {
    // Default handlers are already set up in jest-preloaded.ts
    render(<BlogContainer />);

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    // Override handlers for error scenario
    server.use(
      http.get('/api/blog', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(<BlogContainer />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Available MSW Handler Factories

| Factory                        | Endpoints                                                |
| ------------------------------ | -------------------------------------------------------- |
| `createTraceHandlers()`        | `/api/traces/*`, alerts, stats                           |
| `createExperienceHandlers()`   | `/api/experience`                                        |
| `createProjectHandlers()`      | `/api/projects`                                          |
| `createBlogHandlers()`         | `/api/blog`, `/api/blog/:slug`                           |
| `createAboutHandlers()`        | `/api/about/resume`                                      |
| `createArchitectureHandlers()` | `/api/architecture/adrs`, `/api/architecture/components` |
| `createAuthHandlers()`         | `/api/auth/login`, `/api/auth/logout`                    |

### userEvent for Interactions (Required)

Always use `userEvent` instead of `fireEvent` for user interactions:

```typescript
import { render, screen, waitFor, userEvent } from 'ui/test-utils';

it('should submit form when button is clicked', async () => {
  const user = userEvent.setup();

  render(<MyForm />);

  await user.type(screen.getByLabelText('Username'), 'demo');
  await user.type(screen.getByLabelText('Password'), 'password');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});

// For keyboard events
await user.keyboard('{Escape}');
await user.keyboard('{Enter}');
```

### Legacy: Axios Mocking (Deprecated)

**Note:** Axios mocking is still supported but MSW is preferred for new tests.

```typescript
// Legacy pattern - still works but prefer MSW
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

mockAxios.get.mockResolvedValue({ data: [...] });
```

### Example: UI Container Integration Test

```typescript
// blog.container.test.tsx
import { render, screen, waitFor, userEvent } from 'ui/test-utils';
import { server, createBlogHandlers } from 'ui/test-utils/msw';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';
import { BlogContainer } from './blog.container';

// NOTE: ESM libraries (react-markdown, mermaid, web-vitals, etc.) are globally
// mocked in jest-preloaded.ts - no per-test mocking needed!

describe('BlogContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth state
    useAuthStore.setState({ isAuthenticated: false, token: null });
  });

  it('should display loading state initially', async () => {
    // Use MSW with delay to show loading state
    server.use(
      http.get('/api/blog', async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json([]);
      }),
    );

    render(<BlogContainer />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display blog posts after loading', async () => {
    // Default handlers already provide mock data
    render(<BlogContainer />);

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument();
    });
  });

  it('should display error state when API fails', async () => {
    server.use(
      http.get('/api/blog', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(<BlogContainer />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no posts exist', async () => {
    server.use(...createBlogHandlers({ posts: [] }));

    render(<BlogContainer />);

    await waitFor(() => {
      expect(screen.getByText(/no posts/i)).toBeInTheDocument();
    });
  });
});
```

### Example: Testing User Interactions with userEvent

```typescript
import { render, screen, waitFor, userEvent } from 'ui/test-utils';
import { server } from 'ui/test-utils/msw';
import { http, HttpResponse } from 'msw';

it('should create a new post when form is submitted', async () => {
  const user = userEvent.setup();
  let capturedBody: any;

  server.use(
    http.post('/api/blog', async ({ request }) => {
      capturedBody = await request.json();
      return HttpResponse.json({ id: '1', ...capturedBody }, { status: 201 });
    }),
  );

  render(<CreateBlogPostContainer />);

  await user.type(screen.getByLabelText('Title'), 'New Post');
  await user.type(screen.getByLabelText('Content'), 'Post content');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(capturedBody).toEqual({
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

#### Global Mocks (Automatic)

ESM-only libraries and browser APIs are **automatically mocked** in `jest-preloaded.ts`. You don't need to add per-test mocks for these:

| Mock File          | Libraries Mocked                                                        |
| ------------------ | ----------------------------------------------------------------------- |
| `mockMarkdown.tsx` | `react-markdown`, `remark-gfm`, `mermaid`, `react-syntax-highlighter/*` |
| `mockWebVitals.ts` | `web-vitals`                                                            |
| `mockRecharts.tsx` | `recharts`                                                              |

**Why global?** These libraries use ESM and/or browser-only APIs. Since all shared components are exported via barrel file, the mocks must load before any import.

#### MockEventSource

For testing Server-Sent Events (SSE) streams:

```typescript
import { MockEventSource } from 'ui/test-utils/mockEventSource';

beforeEach(() => {
  MockEventSource.install();
});

afterEach(() => {
  MockEventSource.uninstall();
});

it('should display streamed data', async () => {
  render(<TracesContainer />);

  // Simulate SSE message
  MockEventSource.simulateMessage(JSON.stringify({ traceId: '123' }));

  await waitFor(() => {
    expect(screen.getByText('123')).toBeInTheDocument();
  });
});
```

#### mockRecharts

**Note:** Recharts is globally mocked (see table above). You typically don't need to add manual mocks. The example below shows advanced usage if you need custom behavior:

```typescript
// Only if you need custom chart mock behavior (rare)
import { mockRecharts } from 'ui/test-utils/mockRecharts';

jest.mock('recharts', () => mockRecharts());

it('should render chart with data', async () => {
  render(<TraceTrends />);
  expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
});
```

### Server Test Utils (`src/server/test-utils`)

Centralized test utilities for mocking external dependencies and creating test data.

#### mockSentry

For testing error reporting without calling Sentry APIs:

```typescript
import 'server/test-utils/mockSentry';

// Mock is auto-applied via import
// Tests can verify Sentry.captureException was called
import * as Sentry from '@sentry/node';
expect(Sentry.captureException).toHaveBeenCalledWith(error);
```

#### mockNodemailer

For testing email functionality without sending real emails:

```typescript
import {
  mockNodemailer,
  mockSendMail,
  resetNodemailerMock,
} from 'server/test-utils/mockNodemailer';

jest.mock('nodemailer', () => mockNodemailer);

beforeEach(() => resetNodemailerMock());

it('should send alert email', async () => {
  await alertService.sendEmail('test@example.com', 'Alert!');
  expect(mockSendMail).toHaveBeenCalledWith(
    expect.objectContaining({ to: 'test@example.com' }),
  );
});
```

#### builders

Fluent builders for creating test data with sensible defaults:

```typescript
import {
  TraceBuilder,
  RateLimitRecordBuilder,
} from 'server/test-utils/builders';

it('should filter slow traces', () => {
  const slowTrace = new TraceBuilder().withDuration(5000).build();
  const fastTrace = new TraceBuilder().withDuration(50).build();

  const result = filterSlowTraces([slowTrace, fastTrace]);
  expect(result).toEqual([slowTrace]);
});

it('should cleanup expired records', () => {
  const expiredRecord = new RateLimitRecordBuilder()
    .withExpiresAt(new Date(Date.now() - 1000))
    .build();
  // ...
});
```

#### cronTestUtils

For testing scheduled tasks:

```typescript
import { createCronTestScheduler } from 'server/test-utils/cronTestUtils';

it('should cleanup old traces', async () => {
  const scheduler = createCronTestScheduler();
  const handler = jest.fn();

  scheduler.registerHandler('0 * * * *', handler);
  scheduler.advanceTo('01:00:00');

  expect(handler).toHaveBeenCalled();
});
```

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
