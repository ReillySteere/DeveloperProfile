# ADR-015: Testing Strategy and Coverage Requirements

## Status

Accepted - February 1, 2026

## Context

As an AI-agent optimized codebase, comprehensive testing is critical for detecting unintended
changes introduced by AI-generated code. Without strong test coverage, AI modifications could
introduce subtle bugs that go undetected until production.

### Key Challenges

1. **AI-generated code risk**: AI can introduce plausible-looking but incorrect code
2. **Hidden dependencies**: Changes in one area can affect seemingly unrelated code
3. **Coverage gaps**: Traditional unit tests may miss integration issues
4. **Test maintenance**: Overly granular tests become brittle and hard to maintain

### Testing Philosophies Considered

| Approach          | Description                              | Limitation                   |
| ----------------- | ---------------------------------------- | ---------------------------- |
| Unit test focused | Test every function in isolation         | Misses integration issues    |
| E2E only          | Test complete user flows                 | Slow, hard to debug failures |
| Testing Trophy    | Favor integration, minimal unit/E2E      | Requires good test utilities |
| Hybrid            | Integration default, unit for edge cases | Requires clear guidelines    |

## Decision

Adopt the **Testing Trophy** approach as advocated by Kent C. Dodds, with 100% coverage
requirements and MSW for network mocking.

Reference: [The Testing Trophy and Testing Classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

### 1. Coverage Requirements

| Layer    | Statements | Branches | Functions | Lines  | Rationale                                |
| -------- | ---------- | -------- | --------- | ------ | ---------------------------------------- |
| Server   | 100%       | 100%     | 100%      | 100%   | Critical business logic, smaller surface |
| Frontend | 100%\*     | 100%\*   | 100%\*    | 100%\* | Same standard, currently catching up     |

\*Note: Frontend currently at 92-98% due to MSW migration in progress. Target is 100% parity with server.

### 2. Test Type Hierarchy

```
                    ┌─────────────┐
                    │    E2E      │  ← Critical user journeys only
                    │  (Playwright)│
                ┌───┴─────────────┴───┐
                │    Integration      │  ← Primary focus (Testing Trophy)
                │  (Jest + MSW/DB)    │
            ┌───┴─────────────────────┴───┐
            │         Unit                │  ← Sparingly, for edge cases
            │    (Jest, Manual DI)        │
        ┌───┴─────────────────────────────┴───┐
        │           Static Analysis           │  ← TypeScript, ESLint
        └─────────────────────────────────────┘
```

### 3. Integration Test Patterns

#### Frontend: Container-Level Testing

```typescript
// ✅ Correct: Test at container level with MSW
describe('BlogContainer', () => {
  it('fetches and displays blog posts', async () => {
    // MSW intercepts at network level
    render(<BlogContainer />);

    await waitFor(() => {
      expect(screen.getByText('Post Title')).toBeInTheDocument();
    });
  });
});

// ❌ Avoid: Testing child components in isolation
describe('BlogList', () => {
  it('renders posts', () => {
    render(<BlogList posts={mockPosts} />);  // Skip this level
  });
});
```

Benefits:

- Tests actual user flows
- Catches integration issues between hooks and components
- More resilient to refactoring

#### Backend: Module-Level Testing

```typescript
// ✅ Correct: Integration test with in-memory database
describe('BlogModule Integration', () => {
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          synchronize: true,
        }),
        BlogModule,
      ],
    }).compile();
  });

  it('creates and retrieves blog post', async () => {
    const created = await service.create(postData);
    const found = await service.findOne(created.id);
    expect(found.title).toBe(postData.title);
  });
});
```

### 4. Unit Tests: When to Use

Unit tests are allowed but should be used **sparingly** for:

- Complex algorithmic logic (e.g., date calculations, string parsing)
- Edge cases unreachable via integration tests
- Utility functions with many branches
- Error handling paths difficult to trigger

```typescript
// ✅ Appropriate unit test: Complex branching logic
describe('parseMarkdownFrontmatter', () => {
  it('handles missing frontmatter', () => { ... });
  it('handles malformed YAML', () => { ... });
  it('handles empty content', () => { ... });
});

// ❌ Avoid: Testing simple pass-through logic
describe('BlogService.findAll', () => {
  it('calls repository.find', () => { ... });  // Just test at integration level
});
```

### 5. MSW Over Axios Mocking

**Use MSW (Mock Service Worker)** for all frontend API mocking.

Rationale:

- TanStack Query error states are easier to test with MSW responses
- Tests the actual fetch/response cycle including serialization
- Handler factories enable scalable scenario testing
- Network-level mocking catches more integration issues

```typescript
// ✅ Correct: MSW handler factory
export const createBlogHandlers = (overrides?: Partial<BlogHandlerOptions>) => [
  http.get('/api/blog', () => {
    return HttpResponse.json(overrides?.posts ?? defaultPosts);
  }),
  http.get('/api/blog/:slug', ({ params }) => {
    const post = (overrides?.posts ?? defaultPosts).find(
      (p) => p.slug === params.slug,
    );
    return post
      ? HttpResponse.json(post)
      : new HttpResponse(null, { status: 404 });
  }),
];

// ❌ Avoid: Direct axios mocking
jest.mock('axios');
mockedAxios.get.mockResolvedValue({ data: mockPosts }); // Legacy pattern
```

### 6. Test File Organization

```
src/
├── server/
│   └── modules/
│       └── blog/
│           ├── blog.service.ts
│           ├── blog.service.test.ts        # Unit tests (if needed)
│           └── blog.integration.test.ts    # Primary: Integration tests
└── ui/
    └── containers/
        └── blog/
            ├── blog.container.tsx
            └── blog.container.test.tsx     # Primary: Container integration
```

## Implementation

### Jest Configuration

```javascript
// jest.node.ts (Server)
coverageThreshold: {
  global: {
    statements: 100,
    branches: 100,
    functions: 100,
    lines: 100,
  },
}

// jest.browser.ts (Frontend) - Target state
coverageThreshold: {
  global: {
    statements: 100,
    branches: 100,
    functions: 100,
    lines: 100,
  },
}
```

### MSW Setup

```typescript
// src/ui/test-utils/msw/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// jest-preloaded.ts
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Consequences

### Positive

- **AI safety net**: 100% coverage catches unintended AI modifications
- **Integration confidence**: Tests verify actual user flows
- **Refactoring safety**: Container-level tests survive internal changes
- **Surprise dependency detection**: Integration tests expose hidden coupling
- **Maintainable**: Fewer, more meaningful tests than unit-heavy approach

### Negative

- **Initial investment**: Building MSW handlers and test utilities takes time
- **Test runtime**: Integration tests slower than unit tests
- **Coverage discipline**: 100% requirement can feel restrictive

### Trade-offs Accepted

| Trade-off                   | Rationale                                    |
| --------------------------- | -------------------------------------------- |
| Slower tests                | Worth it for integration confidence          |
| More test infrastructure    | MSW handlers are reusable and scalable       |
| Strict coverage requirement | Essential for AI-assisted development safety |

## Related Documentation

- [ADR-016: Test Utilities Architecture](ADR-016-test-utilities-architecture.md)
- [Testing Workflow Skill](../../.github/skills/testing-workflow/SKILL.md)
- [Kent C. Dodds: Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
