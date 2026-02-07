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
          'src/ui/index.tsx', // entry points
        ],
      },
      to: {},
    },
    /* UI Specific Rules */
    {
      name: 'ui-no-server',
      severity: 'error',
      comment:
        'UI code should never import generally from Server code (use shared types instead).',
      from: {
        path: '^src/ui',
      },
      to: {
        path: '^src/server',
      },
    },
    {
      name: 'feature-isolation',
      severity: 'error',
      comment:
        'Feature containers should be isolated. They should not import from other feature containers.',
      from: {
        path: '^src/ui/containers/([^/]+)',
      },
      to: {
        path: '^src/ui/containers/([^/]+)',
        pathNot: [
          '^src/ui/containers/$1', // Allow internal imports
          '/hooks/', // Allow importing hooks for cross-feature data integration
        ],
      },
    },
    {
      name: 'components-no-containers',
      severity: 'warn',
      comment:
        'Presentational components should usually not import containers.',
      from: {
        path: '/components/',
      },
      to: {
        path: '\\.container\\.tsx?$',
      },
    },
    {
      name: 'ui-no-dto',
      severity: 'error',
      comment:
        'UI code should never import DTOs (Data Transfer Objects). Use shared types instead.',
      from: {
        path: '^src/ui',
      },
      to: {
        path: '\\.dto\\.ts$',
      },
    },
    {
      name: 'view-isolation',
      severity: 'error',
      comment:
        'Views should not import other views. Share logic via components/ or hooks/.',
      from: {
        path: '^src/ui/containers/([^/]+)/views/',
      },
      to: {
        path: '^src/ui/containers/$1/views/',
      },
    },
    {
      name: 'shared-no-features',
      severity: 'error',
      comment: 'Shared UI code cannot import from specific feature containers.',
      from: {
        path: '^src/ui/shared',
      },
      to: {
        path: '^src/ui/containers',
      },
    },
    {
      name: 'only-containers-access-views',
      severity: 'error',
      comment:
        'Views are private to their containers. Only .container.tsx files can import from /views/.',
      from: {
        pathNot: '\\.container\\.tsx?$',
      },
      to: {
        path: '/views/',
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
        'routeTree.gen.ts',
        '^src/ui/shared/routes',
        '\\.s?css$',
        '^src/ui/index\\.tsx$',
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
        collapsePattern:
          'node_modules/[^/]+|^src/ui/shared/components+|^src/ui/shared/hooks',
      },
      archi: {
        collapsePattern:
          '^(node_modules|packages|src|lib|app|bin|test(s?)|spec(s?))/[^/]+|\\d+\\.[^/]+|[^/]+\\.(js|ts|json|vue|tsx|jsx|svelte|html)',
      },
    },
  },
};
