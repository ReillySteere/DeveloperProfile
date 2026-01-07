/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
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
    {
      name: 'no-deprecated-core',
      comment:
        'A module depends on a built-in module that has been deprecated. Consider finding an alternative.',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: [
          '^(v8\/tools\/codemap)$',
          '^(v8\/tools\/consarray)$',
          '^(v8\/tools\/csvparser)$',
          '^(v8\/tools\/logreader)$',
          '^(v8\/tools\/profile_view)$',
          '^(v8\/tools\/splaytree)$',
          '^(v8\/tools\/tickprocessor)$',
          '^(v8\/tools\/SourceMap)$',
          '^(v8\/tools\/tickprocessor-driver)$',
          '^(node-inspect\/lib\/_inspect)$',
          '^(node-inspect\/lib\/internal\/inspect_client)$',
          '^(node-inspect\/lib\/internal\/inspect_repl)$',
          '^(async_hooks)$',
          '^(punycode)$',
          '^(domain)$',
          '^(constants)$',
          '^(sys)$',
          '^(_linklist)$',
          '^(console)$',
        ],
      },
    },

    /* Architectural Boundaries */
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

    /* Server Specific Rules */
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

    /* UI Specific Rules */
    {
      name: 'feature-isolation',
      severity: 'warn',
      comment:
        'Features should verify if they really need to import from other features directly. Prefer shared.',
      from: {
        path: '^src/ui/([^/]+)',
      },
      to: {
        path: '^src/ui/([^/]+)',
        pathNot: [
          '^src/ui/shared',
          '^src/ui/$1', // Allow internal imports
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
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: 'node_modules|^src/shared/types',
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
