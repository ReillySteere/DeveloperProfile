/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  extends: './.dependency-cruiser.js',
  forbidden: [
    /* General Rules */
    {
      name: 'no-circular',
      severity: 'warn',
      comment: 'This module is part of a circular dependency',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-orphans',
      severity: 'info',
      comment: "This is an orphan module - it's likely not used (anymore?).",
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|ts|json)$', // dot files
          '\\.d\\.ts$', // type definitions
          '(^|/)tsconfig\\.json$', // tsconfig
          '(^|/)(babel|webpack|jest|cypress)\\.config\\.(js|ts)$', // config files
          'src/server/main.ts', // entry points
          'src/server/sentry-exception.filter.ts', // global filter used in main
          'src/server/migrations/', // migrations are run by TypeORM, not imported
          'src/ui/index.tsx', // entry points
        ],
      },
      to: {},
    },
    /* Server Specific Rules */
    {
      name: 'server-no-ui',
      severity: 'error',
      comment: 'Server code should never import from UI code.',
      from: {
        path: '^src/server',
      },
      to: {
        path: '^src/ui',
      },
    },
    {
      name: 'controller-no-repository',
      severity: 'warn',
      comment: 'Controllers should call Services, not Repositories directly.',
      from: {
        path: '\\.controller\\.ts$',
      },
      to: {
        path: '\\.repository\\.ts$',
      },
    },
    {
      name: 'service-no-controller',
      severity: 'error',
      comment: 'Services should not import Controllers.',
      from: {
        path: '\\.service\\.ts$',
      },
      to: {
        path: '\\.controller\\.ts$',
      },
    },
    {
      name: 'module-isolation',
      severity: 'error',
      comment:
        'Modules should be isolated. They should not import from other feature modules directly (use Shared or Public API if strictly needed, but prefer decoupling).',
      from: {
        path: '^src/server/modules/([^/]+)',
      },
      to: {
        path: '^src/server/modules/([^/]+)',
        pathNot: [
          '^src/server/modules/$1', // Allow internal imports
        ],
      },
    },
    {
      name: 'shared-no-modules',
      severity: 'error',
      comment:
        'Shared server code cannot import from specific feature modules.',
      from: {
        path: '^src/server/shared',
      },
      to: {
        path: '^src/server/modules',
      },
    },

    /* Hexagonal Architecture Rules for Shared Modules (ADR-005) */
    {
      name: 'shared-module-encapsulation',
      severity: 'error',
      comment:
        'Business modules must use adapters, not shared module internals. See ADR-005.',
      from: {
        path: '^src/server/modules/',
      },
      to: {
        path: '^src/server/shared/modules/[^/]+/',
        pathNot: [
          // Allow importing from barrel files (public API)
          '^src/server/shared/modules/[^/]+/index\\.ts$',
        ],
      },
    },
    {
      name: 'ports-no-implementation-deps',
      severity: 'error',
      comment:
        'Ports should not import implementations (modules or adapters). See ADR-005.',
      from: {
        path: '^src/server/shared/ports/',
      },
      to: {
        path: '^src/server/shared/(modules|adapters)/',
      },
    },
    {
      name: 'adapter-limited-imports',
      severity: 'error',
      comment:
        'Adapters may only import ports, DTOs, tokens, and barrel files from shared modules. See ADR-005.',
      from: {
        path: '^src/server/shared/adapters/',
      },
      to: {
        path: '^src/server/shared/modules/',
        pathNot: [
          // Allow: tokens, DTOs, barrel files
          'tokens\\.ts$',
          '\\.dto\\.ts$',
          'index\\.ts$',
        ],
      },
    },
    {
      name: 'adapters-no-cross-import',
      severity: 'error',
      comment:
        'Adapters should not import from other adapters (except barrel files). See ADR-005.',
      from: {
        path: '^src/server/shared/adapters/([^/]+)',
        pathNot: [
          // Allow barrel files to re-export adapters
          '^src/server/shared/adapters/index\\.ts$',
        ],
      },
      to: {
        path: '^src/server/shared/adapters/([^/]+)',
        pathNot: [
          '^src/server/shared/adapters/$1', // Allow internal imports within same adapter
        ],
      },
    },
  ],
  options: {
    doNotFollow: {
      path: ['node_modules', 'test', 'spec', '\\.test\\.', '\\.spec\\.'],
    },
    exclude: {
      path: [
        'node_modules',
        '^src/shared/types',
        '\\.test\\.',
        '\\.spec\\.',
        'test-utils',
        '\\.s?css$',
        '^src/server/modules/seeding',
        'tokens\\.ts$',
        'app\\.module\\.ts$',
        'main\\.ts$',
      ],
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
      },
      archi: {
        collapsePattern:
          '^(node_modules|packages|src|lib|app|bin|test(s?)|spec(s?))/[^/]+|\\d+\\.[^/]+|[^/]+\\.(js|ts|json|vue|tsx|jsx|svelte|html)',
      },
    },
  },
};
