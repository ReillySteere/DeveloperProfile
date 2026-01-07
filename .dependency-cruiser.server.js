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
