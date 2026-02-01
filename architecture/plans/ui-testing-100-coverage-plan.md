# UI Testing: Path to 100% Coverage

**Status:** Draft  
**Created:** February 1, 2026  
**Target:** Achieve 100% test coverage for UI layer, fully aligned with Testing Trophy approach

---

## Executive Summary

Current UI test coverage is **98.41% statements, 92.51% branches, 98.19% functions, 98.94% lines**. This plan outlines the work required to reach **100% across all metrics** while maintaining alignment with the Testing Trophy strategy (ADR-015).

### Current State

- **Test Suites:** 14 passing (247 tests total)
- **Coverage Gaps:**
  - ~20 uncovered statements (1.59%)
  - ~36 uncovered branches (7.49% - **primary gap**)
  - ~6 uncovered functions (1.81%)
  - ~12 uncovered lines (1.06%)

### Primary Issues

1. **Missing container tests** for detail views (5 containers untested)
2. **Branch coverage gaps** from defensive conditionals and edge cases
3. **Child component isolation** - some components tested outside container context

---

## Testing Trophy Alignment Audit

### ✅ What We're Doing Right

| Principle               | Implementation                                          | Evidence                                          |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Integration-first       | All 8 major containers have integration tests           | blog, status, experience, projects, about covered |
| MSW over mocks          | Handler factories in `ui/test-utils/msw/handlers.ts`    | 100% MSW adoption for new tests                   |
| Container-level testing | Tests render full containers with real hooks            | No mocked internal hooks                          |
| Real user interactions  | `userEvent.setup()` used throughout                     | No `fireEvent` usage in new tests                 |
| QueryState pattern      | Standardized loading/error/empty testing                | Consistent across all container tests             |
| Test utilities          | Centralized in `ui/test-utils/`                         | MockEventSource, mockRecharts, MSW handlers       |
| Coverage enforcement    | `jest.browser.ts` thresholds block PRs                  | Current: 98/92/98/98, Target: 100/100/100/100     |
| Co-located hooks        | Hooks tested via container, not in isolation            | e.g., `useExperience.ts` tested in container      |
| Scenario-based testing  | Handler factories support error/loading/empty scenarios | `createBlogHandlers({ scenario: 'error' })`       |
| Recharts mocking        | Charts mocked at component level, not internals         | `mockRecharts()` utility                          |
| SSE testing             | Custom `MockEventSource` for streaming                  | Used in traces container tests                    |
| Auth integration        | `AuthInterceptor` tested globally, not per-container    | Reduces test duplication                          |
| Route-level rendering   | Tests use `<Router>` context via `test-utils`           | Proper TanStack Router setup                      |

### ⚠️ Gaps from Testing Trophy Principles

| Gap                                                | Impact                | Priority | Fix Strategy                                    |
| -------------------------------------------------- | --------------------- | -------- | ----------------------------------------------- |
| 5 untested detail view containers                  | **Coverage blocker**  | **HIGH** | Add integration tests for each container        |
| Branch coverage at 92.51%                          | Missing edge cases    | **HIGH** | Systematic branch testing (see checklist below) |
| Some child components tested in isolation          | Violates trophy model | MEDIUM   | Remove standalone tests, cover via containers   |
| No explicit empty state testing in some containers | Incomplete scenarios  | MEDIUM   | Add empty array/null data scenarios             |

---

## Coverage Gap Analysis

### 1. Untested Containers (Primary Blocker)

These containers have **zero test coverage** and are the primary blockers for 100%:

| Container                        | Purpose             | Lines | Complexity | Test Priority |
| -------------------------------- | ------------------- | ----- | ---------- | ------------- |
| `adr-detail.container.tsx`       | Single ADR view     | 63    | Low        | **P0**        |
| `component-detail.container.tsx` | Component doc view  | 52    | Low        | **P0**        |
| `dependencies.container.tsx`     | Dependency graph UI | 144   | **High**   | **P0**        |
| `blog-post.container.tsx`        | Blog reader/editor  | 111   | Medium     | **P0**        |
| `trace-detail.container.tsx`     | Trace detail view   | 173   | **High**   | **P0**        |

**Estimated Impact:** Adding these 5 tests will likely close **75-85%** of the coverage gap.

### 2. Branch Coverage Gaps (92.51% → 100%)

Untested branches typically come from:

| Branch Type           | Example                           | Test Strategy                              |
| --------------------- | --------------------------------- | ------------------------------------------ |
| Defensive checks      | `if (data?.items?.length)`        | Test with `null`, `undefined`, empty array |
| Error handling        | `catch` blocks, error callbacks   | MSW error responses, network failures      |
| Optional features     | Auth-gated actions, feature flags | Test authenticated + unauthenticated       |
| Edge cases            | Empty search results, no data     | Handler factories with empty responses     |
| Loading states        | Initial load vs. refetch          | Test both first load and retry scenarios   |
| Conditional rendering | `{condition && <Component />}`    | Toggle condition in test scenarios         |

### 3. Function Coverage Gaps (98.19% → 100%)

Uncovered functions are likely:

- Event handlers in untested containers
- Callbacks passed to child components but never triggered
- Error handlers that require specific failure scenarios

---

## Action Plan: Phases

### Phase 1: Add Missing Container Tests (Week 1)

**Goal:** Cover the 5 untested containers with integration tests.

#### Task 1.1: ADR Detail Container Test

**File:** `src/ui/containers/architecture/adr-detail.container.test.tsx`

```typescript
describe('AdrDetailContainer', () => {
  it('renders ADR content successfully', async () => { ... });
  it('displays loading state', () => { ... });
  it('handles error state with retry', async () => { ... });
  it('navigates back to architecture page', async () => { ... });
  it('formats date correctly', async () => { ... });
  it('displays status badge with correct styling', async () => { ... });
});
```

**MSW Handler:** Use existing `createArchitectureHandlers()` or extend with ADR detail scenario.

**Branch Coverage Focus:**

- Back button click
- QueryState loading/error/success branches
- Date formatting conditional logic
- Status badge styling conditionals

---

#### Task 1.2: Component Detail Container Test

**File:** `src/ui/containers/architecture/component-detail.container.test.tsx`

```typescript
describe('ComponentDetailContainer', () => {
  it('renders component doc content', async () => { ... });
  it('displays loading state', () => { ... });
  it('handles error state with retry', async () => { ... });
  it('navigates back to architecture page', async () => { ... });
  it('renders markdown content via ArchitectureContent', async () => { ... });
});
```

**Similar to ADR Detail**, simpler implementation.

---

#### Task 1.3: Dependencies Container Test

**File:** `src/ui/containers/architecture/dependencies.container.test.tsx`

**Complexity:** High - Interactive UI with scope/target selection.

```typescript
describe('DependenciesContainer', () => {
  it('renders with default UI scope and first target selected', async () => { ... });
  it('switches between UI and Server scopes', async () => { ... });
  it('changes target selection within scope', async () => { ... });
  it('displays loading state for graph data', () => { ... });
  it('handles error fetching graph metadata', async () => { ... });
  it('handles error fetching specific graph', async () => { ... });
  it('auto-selects first target when scope changes', async () => { ... });
  it('navigates back to architecture page', async () => { ... });
  it('renders DependencyGraph component with correct props', async () => { ... });
});
```

**Branch Coverage Focus:**

- Scope change logic (`handleScopeChange`)
- Target selection change
- Auto-selection effect when targets change
- QueryState branches for both queries (graphs metadata + specific graph)
- Empty targets array handling

**MSW Handler:** Create `createDependencyHandlers()` factory:

```typescript
export const createDependencyHandlers = (options?: {
  metadataScenario?: 'success' | 'error';
  graphScenario?: 'success' | 'error' | 'empty';
}) => [
  http.get('/api/architecture/dependencies', () => { ... }),
  http.get('/api/architecture/dependencies/:scope/:target', () => { ... }),
];
```

---

#### Task 1.4: Blog Post Container Test

**File:** `src/ui/containers/blog/blog-post.container.test.tsx`

**Complexity:** Medium - Reader/editor toggle, auth-gated editing.

```typescript
describe('BlogPostContainer', () => {
  describe('Reader Mode (Unauthenticated)', () => {
    it('renders blog post in reader mode', async () => { ... });
    it('does not show edit button when not authenticated', async () => { ... });
    it('displays loading state', () => { ... });
    it('handles error state with retry', async () => { ... });
  });

  describe('Reader Mode (Authenticated)', () => {
    beforeEach(() => {
      // Mock authenticated state
      useAuthStore.setState({ isAuthenticated: true });
    });

    it('shows edit button when authenticated', async () => { ... });
    it('switches to edit mode when edit button clicked', async () => { ... });
  });

  describe('Editor Mode', () => {
    it('renders editor with post data', async () => { ... });
    it('saves changes and returns to reader mode', async () => { ... });
    it('navigates to new slug if slug changed', async () => { ... });
    it('handles save error', async () => { ... });
    it('cancels editing and returns to reader mode', async () => { ... });
  });
});
```

**Branch Coverage Focus:**

- `isAuthenticated` conditional for edit button
- `isEditing` toggle between reader/editor
- Save success with slug change navigation
- Save error handling
- Cancel editing

**MSW Handler:** Extend `createBlogHandlers()`:

```typescript
http.patch('/api/blog/:id', async ({ request, params }) => {
  const body = await request.json();
  if (options?.updateScenario === 'error') {
    return HttpResponse.json({ message: 'Update failed' }, { status: 500 });
  }
  return HttpResponse.json({ ...body, slug: body.slug || 'updated-slug' });
});
```

---

#### Task 1.5: Trace Detail Container Test

**File:** `src/ui/containers/status/traces/trace-detail.container.test.tsx`

**Complexity:** High - Complex rendering with multiple subsections, formatters.

```typescript
describe('TraceDetailContainer', () => {
  it('renders trace details successfully', async () => { ... });
  it('displays loading state', () => { ... });
  it('handles error state', async () => { ... });
  it('navigates back to traces list', async () => { ... });
  it('formats timestamp correctly', async () => { ... });
  it('displays method with correct styling', async () => { ... });
  it('displays status code with correct styling', async () => { ... });
  it('renders timing waterfall', async () => { ... });
  it('displays request/response headers', async () => { ... });
  it('handles trace with errors', async () => { ... });
});
```

**Branch Coverage Focus:**

- `formatTimestamp` function
- `getMethodClass` conditional logic (multiple HTTP methods)
- `getStatusClass` conditional logic (2xx, 3xx, 4xx, 5xx)
- Conditional rendering of error information
- QueryState branches
- Back button navigation

**MSW Handler:** Extend `createTraceHandlers()`:

```typescript
export const createTraceHandlers = (options?: {
  detailScenario?: 'success' | 'error' | 'with-errors';
}) => [
  http.get('/api/traces', () => { ... }),
  http.get('/api/traces/:traceId', ({ params }) => {
    if (options?.detailScenario === 'error') {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const trace = mockTraceDetail(options?.detailScenario);
    return HttpResponse.json(trace);
  }),
];
```

---

### Phase 2: Systematic Branch Coverage (Week 2)

**Goal:** Identify and test remaining uncovered branches in existing tests.

#### Task 2.1: Coverage Report Analysis

1. Run coverage with HTML report:

   ```bash
   npm run test:ui -- --coverage --coverageReporters=html
   ```

2. Open `coverage/lcov-report/index.html` in browser

3. For each file with <100% branch coverage:
   - Identify specific uncovered branches (highlighted in red)
   - Document branch condition and scenario needed to trigger it
   - Add test case to existing container test

#### Task 2.2: Common Branch Patterns to Test

**Pattern 1: Optional Chaining Defense**

```typescript
// Code
const items = data?.items?.length ? data.items : [];

// Test scenario needed
it('handles missing items gracefully', () => {
  server.use(...createHandlers({ data: null }));
  // Verify fallback behavior
});
```

**Pattern 2: Error Callbacks**

```typescript
// Code
onError: (err) => {
  console.error('Failed:', err);
  alert('Failed');
};

// Test scenario needed
it('displays error message on save failure', async () => {
  server.use(...createHandlers({ scenario: 'save-error' }));
  // Trigger save, verify alert called
});
```

**Pattern 3: Conditional Rendering**

```typescript
// Code
{isAuthenticated && <Button onClick={handleEdit}>Edit</Button>}

// Test scenarios needed
it('shows edit button when authenticated', () => { ... });
it('hides edit button when not authenticated', () => { ... });
```

**Pattern 4: Loading vs. Refetch**

```typescript
// Code
if (isLoading && !data) return <Skeleton />;
if (isLoading && data) return <div>Refreshing... {data}</div>;

// Test scenarios needed
it('shows skeleton on initial load', () => { ... });
it('shows refreshing indicator on refetch', async () => { ... });
```

---

### Phase 3: Child Component Audit (Week 2)

**Goal:** Ensure no child components are tested in isolation (violates Testing Trophy).

#### Task 3.1: Identify Standalone Component Tests

Search for test files that test presentational components in isolation:

```bash
# Find tests not in containers/ or shared/components/
find src/ui -name "*.test.tsx" | grep -v "container.test.tsx" | grep -v "shared/components"
```

#### Task 3.2: Evaluate Each Test

For each found test:

| Component Type                                            | Action                                   |
| --------------------------------------------------------- | ---------------------------------------- |
| **Shared component** (Button, Card, etc.)                 | **KEEP** - These are reusable primitives |
| **Feature child component** (BlogList, TraceRow)          | **REMOVE** - Cover via container         |
| **Complex shared component** (NavigationRail, QueryState) | **KEEP** - Justifiable complexity        |
| **View component** (BlogPostReader, BlogPostEditor)       | **EVALUATE** - If simple wrapper, remove |

#### Task 3.3: Remove or Consolidate

For components to remove:

1. Verify container test covers all scenarios
2. Delete standalone test file
3. Confirm coverage maintained via container

---

### Phase 4: Coverage Enforcement (Week 3)

**Goal:** Lock in 100% coverage and prevent regression.

#### Task 4.1: Update Jest Config

```javascript
// jest.browser.ts
coverageThreshold: {
  global: {
    statements: 100,
    branches: 100,
    functions: 100,
    lines: 100,
  },
}
```

#### Task 4.2: Update ADR-015

Document that UI has achieved 100% coverage parity with server:

```markdown
| Layer    | Statements | Branches | Functions | Lines | Rationale                                |
| -------- | ---------- | -------- | --------- | ----- | ---------------------------------------- |
| Server   | 100%       | 100%     | 100%      | 100%  | Critical business logic, smaller surface |
| Frontend | 100%       | 100%     | 100%      | 100%  | ✅ Achieved parity (February 2026)       |
```

#### Task 4.3: Update Copilot Instructions

Remove temporary language about "MSW migration" and "currently at 92-98%":

```markdown
### Coverage Requirements

| Layer    | Statements | Branches | Functions | Lines |
| -------- | ---------- | -------- | --------- | ----- |
| Server   | 100%       | 100%     | 100%      | 100%  |
| Frontend | 100%       | 100%     | 100%      | 100%  |
```

---

## Testing Trophy Checklist

Use this checklist when writing or reviewing UI tests:

### ✅ Test Structure

- [ ] Tests are at **container level**, not child components (except shared primitives)
- [ ] Container test file is co-located with container: `*.container.test.tsx`
- [ ] Tests use `render()` from `ui/test-utils` (includes QueryClient wrapper)
- [ ] Tests import `screen`, `waitFor` from `ui/test-utils`

### ✅ User Interactions

- [ ] Uses `userEvent.setup()` at start of each test
- [ ] Uses `await user.click()`, `await user.type()` (NOT `fireEvent`)
- [ ] Waits for async updates with `waitFor()` or `findBy*` queries

### ✅ API Mocking (MSW)

- [ ] Uses MSW handler factories from `ui/test-utils/msw/handlers.ts`
- [ ] Default handlers set up globally in `jest-preloaded.ts`
- [ ] Test-specific scenarios use `server.use()` overrides
- [ ] Handler factories support `scenario` parameter (error, empty, success)

### ✅ Scenario Coverage

- [ ] **Loading state:** Test initial data fetch
- [ ] **Success state:** Test with valid data
- [ ] **Error state:** Test API error response + retry button
- [ ] **Empty state:** Test with empty array or null data
- [ ] **Refetch:** Test retry/reload scenarios

### ✅ Auth Scenarios (if applicable)

- [ ] Test unauthenticated user experience
- [ ] Test authenticated user with different permissions
- [ ] Test auth-gated actions (edit, delete, create)

### ✅ Navigation

- [ ] Test route parameters (e.g., `useParams({ from: '/blog/$slug' })`)
- [ ] Test navigation actions (`navigate({ to: '/path' })`)
- [ ] Test back buttons and breadcrumbs

### ✅ Branch Coverage

- [ ] Test all conditional rendering (`{condition && <Component />}`)
- [ ] Test ternary operators (`condition ? <A /> : <B />`)
- [ ] Test optional chaining defense (`data?.items?.length`)
- [ ] Test error callbacks (`onError`, `catch` blocks)
- [ ] Test switch/case or if/else chains

### ✅ No Internal Mocking

- [ ] **DO NOT** mock hooks defined in same feature (e.g., `useBlog`)
- [ ] **DO** mock external libraries (Recharts, Mermaid) at import level
- [ ] **DO** use MSW for API calls, not axios mocks

### ✅ Assertions

- [ ] Use semantic queries: `getByRole`, `getByLabelText`, `getByText`
- [ ] Avoid `getByTestId` unless necessary for complex scenarios
- [ ] Assert on **user-visible behavior**, not implementation details

---

## Tooling and Utilities

### MSW Handler Factory Template

```typescript
// src/ui/test-utils/msw/handlers.ts

type MyFeatureScenario = 'success' | 'error' | 'empty' | 'loading';

interface MyFeatureHandlerOptions {
  scenario?: MyFeatureScenario;
  delayMs?: number;
  data?: MyDataType[];
}

export const createMyFeatureHandlers = (options?: MyFeatureHandlerOptions) => {
  const scenario = options?.scenario ?? 'success';
  const delayMs = options?.delayMs ?? 0;

  return [
    http.get('/api/my-feature', async () => {
      if (delayMs) await delay(delayMs);

      switch (scenario) {
        case 'error':
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 },
          );
        case 'empty':
          return HttpResponse.json([]);
        case 'success':
        default:
          return HttpResponse.json(options?.data ?? defaultData);
      }
    }),
  ];
};
```

### Container Test Template

```typescript
// src/ui/containers/my-feature/my-feature.container.test.tsx

import { render, screen, waitFor, userEvent } from 'ui/test-utils';
import { server } from 'ui/test-utils/msw';
import { createMyFeatureHandlers } from 'ui/test-utils/msw/handlers';
import MyFeatureContainer from './my-feature.container';

describe('MyFeatureContainer', () => {
  describe('Loading State', () => {
    it('displays loading skeleton initially', () => {
      render(<MyFeatureContainer />);
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('renders feature content after loading', async () => {
      render(<MyFeatureContainer />);

      await waitFor(() => {
        expect(screen.getByText('Expected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('displays error message with retry button', async () => {
      server.use(...createMyFeatureHandlers({ scenario: 'error' }));

      render(<MyFeatureContainer />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('retries on button click', async () => {
      server.use(...createMyFeatureHandlers({ scenario: 'error' }));
      const user = userEvent.setup();

      render(<MyFeatureContainer />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Override with success scenario for retry
      server.use(...createMyFeatureHandlers({ scenario: 'success' }));

      await user.click(screen.getByRole('button', { name: /retry/i }));

      await waitFor(() => {
        expect(screen.getByText('Expected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('displays empty message when no data', async () => {
      server.use(...createMyFeatureHandlers({ scenario: 'empty' }));

      render(<MyFeatureContainer />);

      await waitFor(() => {
        expect(screen.getByText(/no items found/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('handles button click', async () => {
      const user = userEvent.setup();
      render(<MyFeatureContainer />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /action/i }));

      // Assert on outcome
    });
  });
});
```

---

## Definition of Done

A container test is **complete** when:

1. ✅ All four QueryState scenarios covered (loading, success, error, empty)
2. ✅ All user interactions tested (clicks, form inputs, navigation)
3. ✅ All conditional rendering paths exercised
4. ✅ Auth-gated features tested for both auth states
5. ✅ Error callbacks and edge cases covered
6. ✅ Coverage report shows 100% for container file
7. ✅ No test-specific implementation details exposed (no data-testid unless necessary)
8. ✅ Test file follows template structure above

---

## Success Metrics

| Metric               | Current | Target                | Measurement                   |
| -------------------- | ------- | --------------------- | ----------------------------- |
| Statement Coverage   | 98.41%  | **100%**              | `jest.browser.ts` threshold   |
| Branch Coverage      | 92.51%  | **100%**              | `jest.browser.ts` threshold   |
| Function Coverage    | 98.19%  | **100%**              | `jest.browser.ts` threshold   |
| Line Coverage        | 98.94%  | **100%**              | `jest.browser.ts` threshold   |
| Untested Containers  | 5       | **0**                 | Manual audit                  |
| Container Tests      | 8       | **13**                | File count                    |
| Isolated Child Tests | TBD     | **0** (except shared) | Manual audit                  |
| MSW Adoption         | ~90%    | **100%**              | Grep for `jest.mock('axios')` |

---

## Timeline Estimate

| Phase                              | Tasks                  | Effort        | Dependencies                      |
| ---------------------------------- | ---------------------- | ------------- | --------------------------------- |
| **Phase 1: Missing Containers**    | 5 container tests      | **3-5 days**  | MSW handlers may need extension   |
| **Phase 2: Branch Coverage**       | Systematic gap filling | **2-3 days**  | Requires coverage report analysis |
| **Phase 3: Child Component Audit** | Remove isolation tests | **1-2 days**  | Phase 1 must ensure coverage      |
| **Phase 4: Enforcement**           | Config + docs update   | **1 day**     | All phases complete               |
| **TOTAL**                          | -                      | **7-11 days** | ~2-3 weeks with buffer            |

---

## Risk Mitigation

| Risk                                       | Likelihood | Impact | Mitigation                                      |
| ------------------------------------------ | ---------- | ------ | ----------------------------------------------- |
| Containers too complex for unit testing    | Medium     | High   | Break into smaller containers if needed         |
| MSW handlers become unwieldy               | Medium     | Medium | Use factory composition, extract common logic   |
| Branch coverage requires excessive mocking | Low        | Medium | Simplify code if defensive checks are excessive |
| 100% threshold too strict for maintenance  | Low        | High   | Document escape hatches (istanbul ignore)       |
| Timeline underestimated                    | Medium     | Medium | Start with Phase 1, reassess after 3 containers |

---

## Related Documentation

- [ADR-015: Testing Strategy](../decisions/ADR-015-testing-strategy.md) - Testing Trophy approach
- [ADR-016: Test Utilities Architecture](../decisions/ADR-016-test-utilities-architecture.md) - MSW, MockEventSource, mockRecharts
- [Testing Workflow Skill](../../.github/skills/testing-workflow/SKILL.md) - Running tests, patterns
- [jest.browser.ts](../../jest.browser.ts) - Frontend Jest configuration

---

## Appendix: Coverage Gap Deep Dive

### A. Statements Gap (98.41% → 100%)

**Estimated 20 uncovered statements** likely include:

- Error callback console.log/alert statements
- Defensive null checks that aren't triggered
- Formatter functions in untested containers
- Navigation callbacks in untested containers

**Fix:** Add tests for untested containers covers most, then targeted tests for remaining.

### B. Branches Gap (92.51% → 100%) - **Primary Gap**

**Estimated 36 uncovered branches** likely include:

- Ternary operators with one path untested
- Optional chaining defense (`data?.items?.length`)
- Switch/case statements with uncovered cases
- Conditional class name application
- Auth-gated rendering with only one auth state tested

**Fix:** Systematic branch testing in Phase 2 with coverage report guidance.

### C. Functions Gap (98.19% → 100%)

**Estimated 6 uncovered functions** likely include:

- Event handlers in untested containers
- Formatter helper functions
- Callbacks passed to child components but never triggered

**Fix:** Container tests will trigger most handlers, formatters need explicit scenario tests.

### D. Lines Gap (98.94% → 100%)

**Estimated 12 uncovered lines** overlap with statement/branch gaps. Once containers are tested and branches covered, line coverage follows.

---

## Questions for Review

1. **Should we delay this until after current feature work?**  
   _Recommendation:_ No - coverage gaps compound technical debt. Do it now.

2. **Is 100% branch coverage realistic given library callbacks?**  
   _Recommendation:_ Yes - mock libraries (Recharts, Mermaid) at import level to control execution.

3. **Should we remove existing isolated child component tests?**  
   _Recommendation:_ Only if container tests provide equal coverage. Audit first, then decide.

4. **Can we use istanbul ignore comments for unreachable branches?**  
   _Recommendation:_ Avoid - indicates code smell. Refactor instead.

5. **Timeline feasible alongside feature work?**  
   _Recommendation:_ Allocate 50% time - 1 container test per day for 5 days, then branch cleanup.

---

**Next Steps:**

1. Review plan with team
2. Prioritize Phase 1 tasks
3. Create GitHub issues for each container test
4. Begin with simplest container (ADR Detail) as proof of concept
