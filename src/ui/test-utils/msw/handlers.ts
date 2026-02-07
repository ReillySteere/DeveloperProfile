/**
 * MSW Request Handlers
 *
 * Central location for all mock API handlers used in UI tests.
 * These handlers intercept network requests at the network level,
 * providing more realistic testing than axios mocks.
 *
 * @see https://mswjs.io/docs/getting-started
 */
import { http, HttpResponse, delay } from 'msw';
import type {
  RequestTrace,
  TraceStats,
  TraceHourlyStats,
  TraceEndpointStats,
  AlertHistoryRecord,
  ExperienceEntry,
  Project,
  BlogPost,
  AdrListItem,
  ComponentDocSummary,
  CaseStudy,
  AggregatedMetrics,
  Benchmark,
} from 'shared/types';

// ============================================================================
// Default Mock Data
// ============================================================================

export const mockTrace: RequestTrace = {
  traceId: 'test-trace-123',
  method: 'GET',
  path: '/api/test',
  statusCode: 200,
  durationMs: 45.5,
  timing: {
    middleware: 1,
    guard: 2,
    interceptorPre: 3,
    handler: 35,
    interceptorPost: 1,
  },
  userId: 1,
  userAgent: 'Mozilla/5.0',
  ip: '127.0.0.1',
  timestamp: '2025-01-23T12:00:00Z',
};

export const mockStats: TraceStats = {
  totalCount: 100,
  avgDuration: 50.5,
  errorRate: 2.5,
};

export const mockHourlyStats: TraceHourlyStats[] = [
  {
    hour: '2025-01-23T12:00:00.000Z',
    count: 10,
    avgDuration: 45,
    errorRate: 5,
    p95Duration: 100,
  },
  {
    hour: '2025-01-23T13:00:00.000Z',
    count: 15,
    avgDuration: 50,
    errorRate: 3,
    p95Duration: 120,
  },
];

export const mockEndpointStats: TraceEndpointStats[] = [
  {
    path: '/api/test',
    method: 'GET',
    count: 50,
    avgDuration: 40,
    errorRate: 2,
  },
  {
    path: '/api/blog',
    method: 'GET',
    count: 30,
    avgDuration: 60,
    errorRate: 1,
  },
];

export const mockAlerts: AlertHistoryRecord[] = [];

export const mockExperiences: ExperienceEntry[] = [
  {
    id: '1',
    company: 'Test Company',
    role: 'Software Engineer',
    description: 'Worked on stuff',
    startDate: '2023-01-15',
    endDate: null,
    bulletPoints: ['Point 1', 'Point 2'],
    tags: ['React', 'TypeScript'],
  },
  {
    id: '2',
    company: 'Another Company',
    role: 'Junior Developer',
    description: 'Learning stuff',
    startDate: '2022-01-15',
    endDate: '2022-12-15',
    bulletPoints: ['Learned A', 'Learned B'],
    tags: ['JavaScript', 'HTML'],
  },
];

export const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Test Project',
    shortDescription: 'A test project description',
    role: 'Lead Developer',
    requirements: ['Req 1', 'Req 2'],
    execution: ['Step 1', 'Step 2'],
    results: ['Result 1', 'Result 2'],
    technologies: ['React', 'TypeScript'],
    startDate: '2023-01-01',
    endDate: '2023-12-31',
  },
];

export const mockBlogPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'test-post',
    title: 'Test Post',
    content: '# Test Content\n\nThis is a test blog post.',
    metaDescription: 'Test excerpt for the blog post',
    publishedAt: '2025-01-01T00:00:00Z',
    tags: ['Testing', 'MSW'],
  },
];

export const mockAdrs: AdrListItem[] = [
  {
    slug: 'ADR-001-test-decision',
    title: 'Test ADR',
    status: 'Accepted',
    date: '2025-01-01',
    number: 1,
    summary: 'Test context summary',
    searchText: 'test adr decision context',
  },
];

export const mockComponents: ComponentDocSummary[] = [
  {
    slug: 'auth',
    name: 'Authentication',
    summary: 'Auth module description',
  },
];

// ============================================================================
// Handler Factories
// ============================================================================

/**
 * Creates trace API handlers with optional overrides.
 */
export function createTraceHandlers(
  overrides: {
    traces?: RequestTrace[];
    stats?: TraceStats;
    hourlyStats?: TraceHourlyStats[];
    endpointStats?: TraceEndpointStats[];
    alerts?: AlertHistoryRecord[];
    traceDetail?: RequestTrace | null;
    delayMs?: number;
  } = {},
) {
  const traces = overrides.traces ?? [mockTrace];
  const stats = overrides.stats ?? mockStats;
  const hourlyStats = overrides.hourlyStats ?? mockHourlyStats;
  const endpointStats = overrides.endpointStats ?? mockEndpointStats;
  const alerts = overrides.alerts ?? mockAlerts;
  const traceDetail = overrides.traceDetail ?? mockTrace;
  const delayMs = overrides.delayMs ?? 0;

  return [
    http.get('/api/traces', async () => {
      if (delayMs) await delay(delayMs);
      return HttpResponse.json(traces);
    }),

    http.get('/api/traces/stats', async () => {
      if (delayMs) await delay(delayMs);
      return HttpResponse.json(stats);
    }),

    http.get('/api/traces/stats/hourly', async () => {
      if (delayMs) await delay(delayMs);
      return HttpResponse.json(hourlyStats);
    }),

    http.get('/api/traces/stats/endpoints', async () => {
      if (delayMs) await delay(delayMs);
      return HttpResponse.json(endpointStats);
    }),

    http.get('/api/traces/alerts', async () => {
      if (delayMs) await delay(delayMs);
      return HttpResponse.json(alerts);
    }),

    http.get('/api/traces/alerts/unresolved', async () => {
      if (delayMs) await delay(delayMs);
      return HttpResponse.json(alerts.filter((a) => !a.resolvedAt));
    }),

    http.get('/api/traces/:traceId', async ({ params }) => {
      if (delayMs) await delay(delayMs);
      if (traceDetail === null) {
        return new HttpResponse(null, { status: 404 });
      }
      // Return trace matching the ID or default
      const trace = traces.find((t) => t.traceId === params.traceId);
      return HttpResponse.json(trace ?? traceDetail);
    }),

    http.post('/api/traces/alerts/:id/resolve', async () => {
      if (delayMs) await delay(delayMs);
      return HttpResponse.json({ id: 1, resolved: true });
    }),

    http.patch('/api/traces/alerts/rules', async () => {
      if (delayMs) await delay(delayMs);
      return HttpResponse.json({ success: true });
    }),
  ];
}

/**
 * Creates experience API handlers.
 */
export function createExperienceHandlers(
  experiences: ExperienceEntry[] = mockExperiences,
) {
  return [
    http.get('/api/experience', () => {
      return HttpResponse.json(experiences);
    }),
  ];
}

/**
 * Creates project API handlers.
 */
export function createProjectHandlers(projects: Project[] = mockProjects) {
  return [
    http.get('/api/projects', () => {
      return HttpResponse.json(projects);
    }),
  ];
}

/**
 * Creates blog API handlers.
 */
export function createBlogHandlers(
  overrides: {
    posts?: BlogPost[];
    singlePost?: BlogPost | null;
  } = {},
) {
  const posts = overrides.posts ?? mockBlogPosts;

  return [
    http.get('/api/blog', () => {
      return HttpResponse.json(posts);
    }),

    http.get('/api/blog/:slug', ({ params }) => {
      const post =
        overrides.singlePost ?? posts.find((p) => p.slug === params.slug);
      if (!post) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json(post);
    }),

    http.post('/api/blog', async ({ request }) => {
      const body = (await request.json()) as Partial<BlogPost>;
      const newPost: BlogPost = {
        id: String(posts.length + 1),
        slug: body.slug ?? 'new-post',
        title: body.title ?? 'New Post',
        content: body.content ?? '',
        metaDescription: body.metaDescription ?? '',
        publishedAt: new Date().toISOString(),
        tags: body.tags ?? [],
      };
      return HttpResponse.json(newPost, { status: 201 });
    }),

    http.patch('/api/blog/:slug', async ({ params, request }) => {
      const body = (await request.json()) as Partial<BlogPost>;
      const existingPost = posts.find((p) => p.slug === params.slug);
      if (!existingPost) {
        return new HttpResponse(null, { status: 404 });
      }
      const updatedPost = { ...existingPost, ...body };
      return HttpResponse.json(updatedPost);
    }),

    http.delete('/api/blog/:slug', ({ params }) => {
      const exists = posts.some((p) => p.slug === params.slug);
      if (!exists) {
        return new HttpResponse(null, { status: 404 });
      }
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

/**
 * Creates about API handlers.
 * Note: About page is static content, only resume download needs mocking.
 */
export function createAboutHandlers() {
  return [
    http.get('/api/about/resume', () => {
      // Return a mock PDF blob
      return new HttpResponse(new Blob(['mock pdf content']), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="resume.pdf"',
        },
      });
    }),
  ];
}

/**
 * Creates architecture API handlers.
 */

// Mock data for dependency graphs
export const mockDependencyGraphsData = {
  generatedAt: '2026-01-18T00:00:00Z',
  ui: {
    containers: [
      {
        name: 'blog',
        label: 'Blog',
        nodes: [
          { id: 'blog', label: 'Blog' },
          { id: 'auth', label: 'Auth' },
        ],
        edges: [{ source: 'blog', target: 'auth' }],
      },
      {
        name: 'about',
        label: 'About',
        nodes: [{ id: 'about', label: 'About' }],
        edges: [],
      },
    ],
  },
  server: {
    modules: [
      {
        name: 'auth',
        label: 'Auth',
        nodes: [{ id: 'auth', label: 'Auth' }],
        edges: [],
      },
    ],
  },
};

export function createArchitectureHandlers(
  overrides: {
    adrs?: AdrListItem[];
    components?: ComponentDocSummary[];
    dependencyGraphs?: typeof mockDependencyGraphsData;
    emptyGraph?: boolean;
  } = {},
) {
  const adrs = overrides.adrs ?? mockAdrs;
  const components = overrides.components ?? mockComponents;
  const dependencyGraphs =
    overrides.dependencyGraphs ?? mockDependencyGraphsData;

  return [
    http.get('/api/architecture/adrs', () => {
      return HttpResponse.json(adrs);
    }),

    http.get('/api/architecture/adrs/:slug', ({ params }) => {
      const adr = adrs.find((a) => a.slug === params.slug);
      if (!adr) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json({ ...adr, content: '# ADR Content' });
    }),

    http.get('/api/architecture/components', () => {
      return HttpResponse.json(components);
    }),

    http.get('/api/architecture/components/:slug', ({ params }) => {
      const component = components.find((c) => c.slug === params.slug);
      if (!component) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json({
        ...component,
        content: '# Component Content',
      });
    }),

    http.get('/api/architecture/dependencies', () => {
      return HttpResponse.json(dependencyGraphs);
    }),

    http.get('/api/architecture/dependencies/:scope/:target', ({ params }) => {
      const scope = params.scope as 'ui' | 'server';
      const target = params.target as string;

      // Find the specific graph
      const graphs =
        scope === 'ui'
          ? dependencyGraphs.ui.containers
          : dependencyGraphs.server.modules;
      const graph = graphs.find((g) => g.name === target);

      if (!graph) {
        return new HttpResponse(null, { status: 404 });
      }

      // Return empty graph if requested
      if (overrides.emptyGraph) {
        return HttpResponse.json({
          ...graph,
          nodes: [],
          edges: [],
        });
      }

      return HttpResponse.json(graph);
    }),
  ];
}

/**
 * Auth response scenario type for test configuration.
 */
export type AuthScenario =
  | 'success' // Normal login success with token
  | 'failure' // Login fails with error message
  | 'missing-token' // Server returns 200 but no token (malformed response)
  | 'no-message' // Server returns 401 but no error message
  | 'network-error'; // Network failure

/**
 * Creates auth API handlers with configurable scenarios.
 */
export function createAuthHandlers(
  overrides: {
    scenario?: AuthScenario;
    token?: string;
    errorMessage?: string;
  } = {},
) {
  const scenario = overrides.scenario ?? 'success';
  const token = overrides.token ?? 'mock-jwt-token';
  const errorMessage = overrides.errorMessage ?? 'Invalid credentials';

  return [
    http.post('/api/auth/login', async ({ request }) => {
      const body = (await request.json()) as {
        username: string;
        password: string;
      };

      switch (scenario) {
        case 'success':
          return HttpResponse.json({
            access_token: token,
            user: { username: body.username },
          });

        case 'failure':
          return HttpResponse.json({ message: errorMessage }, { status: 401 });

        case 'missing-token':
          // Server returns 200 but malformed response (no token)
          return HttpResponse.json({ user: { username: body.username } });

        case 'no-message':
          // Server returns 401 but no error message
          return HttpResponse.json({}, { status: 401 });

        case 'network-error':
          // Throw a network error to simulate connection failure
          throw new Error('Network error');

        default:
          return HttpResponse.json({
            access_token: token,
            user: { username: body.username },
          });
      }
    }),

    http.post('/api/auth/logout', () => {
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

// ============================================================================
// Case Study Handlers
// ============================================================================

export const mockCaseStudies: CaseStudy[] = [
  {
    id: '1',
    slug: 'test-case-study',
    projectId: '1',
    project: mockProjects[0],
    problemContext: '# The Problem\n\nLegacy system issues.',
    challenges: ['Technical debt', 'Scalability concerns'],
    approach: '# Our Approach\n\nModernization strategy.',
    phases: [
      {
        name: 'Discovery',
        description: 'Research and analysis',
        duration: '2 weeks',
      },
      { name: 'Implementation', description: 'Build and test' },
    ],
    keyDecisions: ['Adopted TypeScript', 'Event-driven architecture'],
    outcomeSummary: '# The Results\n\nSignificant improvements.',
    metrics: [
      { label: 'Test Coverage', before: '60%', after: '95%' },
      { label: 'Build Time', after: '30s', description: 'Down from 5 minutes' },
    ],
    learnings: ['Testing investment pays off', 'Documentation matters'],
    published: true,
  },
];

/**
 * Creates case study API handlers.
 */
export function createCaseStudyHandlers(
  overrides: {
    caseStudies?: CaseStudy[];
    singleCaseStudy?: CaseStudy | null;
    delayMs?: number;
  } = {},
) {
  const caseStudies = overrides.caseStudies ?? mockCaseStudies;
  const delayMs = overrides.delayMs ?? 0;

  return [
    http.get('/api/case-studies', async () => {
      if (delayMs) await delay(delayMs);
      const published = caseStudies.filter((cs) => cs.published);
      return HttpResponse.json(published);
    }),

    http.get('/api/case-studies/project/:projectId', async ({ params }) => {
      if (delayMs) await delay(delayMs);
      const caseStudy = caseStudies.find(
        (cs) => cs.projectId === params.projectId,
      );
      if (!caseStudy) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json(caseStudy);
    }),

    http.get('/api/case-studies/:slug', async ({ params }) => {
      if (delayMs) await delay(delayMs);
      const caseStudy =
        overrides.singleCaseStudy ??
        caseStudies.find((cs) => cs.slug === params.slug);
      if (!caseStudy) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json(caseStudy);
    }),

    http.post('/api/case-studies', async ({ request }) => {
      if (delayMs) await delay(delayMs);
      const body = (await request.json()) as Partial<CaseStudy>;
      const newCaseStudy: CaseStudy = {
        id: String(caseStudies.length + 1),
        slug: body.slug ?? 'new-case-study',
        projectId: body.projectId ?? '1',
        project: mockProjects[0],
        problemContext: body.problemContext ?? '',
        challenges: body.challenges ?? [],
        approach: body.approach ?? '',
        phases: body.phases ?? [],
        keyDecisions: body.keyDecisions ?? [],
        outcomeSummary: body.outcomeSummary ?? '',
        metrics: body.metrics ?? [],
        learnings: body.learnings ?? [],
        published: body.published ?? false,
      };
      return HttpResponse.json(newCaseStudy, { status: 201 });
    }),

    http.put('/api/case-studies/:id', async ({ params, request }) => {
      if (delayMs) await delay(delayMs);
      const body = (await request.json()) as Partial<CaseStudy>;
      const existingCaseStudy = caseStudies.find((cs) => cs.id === params.id);
      if (!existingCaseStudy) {
        return new HttpResponse(null, { status: 404 });
      }
      const updatedCaseStudy = { ...existingCaseStudy, ...body };
      return HttpResponse.json(updatedCaseStudy);
    }),

    http.delete('/api/case-studies/:id', ({ params }) => {
      const exists = caseStudies.some((cs) => cs.id === params.id);
      if (!exists) {
        return new HttpResponse(null, { status: 404 });
      }
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

// ============================================================================
// Performance Handlers
// ============================================================================

export const mockPerformanceMetrics: AggregatedMetrics = {
  totalReports: 50,
  averageLcp: 2200,
  averageFcp: 1500,
  averageCls: 0.05,
  averageTtfb: 600,
  p75Lcp: 2500,
  p75Fcp: 1800,
  p75Cls: 0.1,
  p75Ttfb: 800,
};

export const mockBenchmarks: Benchmark[] = [
  {
    metric: 'lcp',
    p50: 2100,
    p75: 2500,
    p90: 4200,
    source: 'Chrome UX Report',
    industry: 'Portfolio',
    lastUpdated: '2025-01-01',
  },
  {
    metric: 'fcp',
    p50: 1400,
    p75: 1800,
    p90: 3200,
    source: 'Chrome UX Report',
    industry: 'Portfolio',
    lastUpdated: '2025-01-01',
  },
  {
    metric: 'cls',
    p50: 0.04,
    p75: 0.1,
    p90: 0.25,
    source: 'Chrome UX Report',
    industry: 'Portfolio',
    lastUpdated: '2025-01-01',
  },
];

export type PerformanceScenario = 'success' | 'error' | 'empty' | 'with-bundle';

export function createPerformanceHandlers(
  overrides: {
    scenario?: PerformanceScenario;
    delayMs?: number;
  } = {},
) {
  const scenario = overrides.scenario ?? 'success';
  const delayMs = overrides.delayMs ?? 0;

  return [
    http.get('/api/performance/metrics', async () => {
      if (delayMs) await delay(delayMs);

      switch (scenario) {
        case 'error':
          return HttpResponse.json(
            { message: 'Server error' },
            { status: 500 },
          );
        case 'empty':
          return HttpResponse.json({
            totalReports: 0,
            averageLcp: 0,
            averageFcp: 0,
            averageCls: 0,
            averageTtfb: 0,
            p75Lcp: 0,
            p75Fcp: 0,
            p75Cls: 0,
            p75Ttfb: 0,
          });
        default:
          return HttpResponse.json(mockPerformanceMetrics);
      }
    }),

    http.get('/api/performance/benchmarks', async () => {
      if (delayMs) await delay(delayMs);
      return HttpResponse.json(mockBenchmarks);
    }),

    http.get('/api/performance/bundle', async () => {
      if (delayMs) await delay(delayMs);

      if (scenario === 'with-bundle') {
        return HttpResponse.json({
          totalSize: 500000,
          gzippedSize: 150000,
          modules: [
            {
              name: 'main.js',
              path: 'dist/main.js',
              size: 300000,
              gzippedSize: 90000,
              isInitial: true,
            },
            {
              name: 'vendor.js',
              path: 'dist/vendor.js',
              size: 200000,
              gzippedSize: 60000,
              isInitial: true,
            },
          ],
          generatedAt: '2025-01-01T00:00:00Z',
        });
      }

      return HttpResponse.json(null);
    }),

    http.post('/api/performance/report', async () => {
      if (delayMs) await delay(delayMs);
      return HttpResponse.json(
        { id: 'mock-report-id', sessionId: 'test' },
        { status: 201 },
      );
    }),
  ];
}

// ============================================================================
// Default Handlers
// ============================================================================

/**
 * Default handlers for all API endpoints.
 * Use these as the base and override specific handlers as needed.
 */
export const handlers = [
  ...createTraceHandlers(),
  ...createExperienceHandlers(),
  ...createProjectHandlers(),
  ...createBlogHandlers(),
  ...createCaseStudyHandlers(),
  ...createAboutHandlers(),
  ...createArchitectureHandlers(),
  ...createAuthHandlers(),
  ...createPerformanceHandlers(),
];
