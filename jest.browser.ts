module.exports = {
  testRegex: ['./src/ui/.*test\\.[jt]s[x]*$'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      // Load config from .swcrc
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^ui/(.*)$': '<rootDir>/src/ui/$1',
    '^shared/(.*)$': '<rootDir>/src/shared/$1',
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
  modulePaths: ['<rootDir>/node_modules'],
  moduleDirectories: [__dirname, 'node_modules', 'test-utils'],
  setupFilesAfterEnv: ['<rootDir>/src/ui/test-utils/jest-preloaded.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  clearMocks: true,
  testEnvironment: 'jest-environment-jsdom',
  testEnvironmentOptions: {
    url: 'http://jest',
  },
  collectCoverageFrom: [
    'src/ui/**/*.ts',
    'src/ui/**/*.tsx',
    '!src/ui/test-utils/**',
    '!src/ui/index.tsx',
    '!src/ui/routeTree.gen.ts',
    '!src/ui/shared/routes/*.tsx',
    '!src/ui/**/*.types.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageReporters: ['html', 'text', 'text-summary', 'cobertura'],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    // Dependencies container has edge cases for graph rendering
    './src/ui/containers/architecture/dependencies.container.tsx': {
      statements: 96,
      branches: 92,
      functions: 90,
      lines: 96,
    },
    './src/ui/containers/architecture/hooks/useArchitecture.ts': {
      statements: 100,
      branches: 66,
      functions: 100,
      lines: 100,
    },
    // Traces module has SSE streaming and filter components that are partially tested
    './src/ui/containers/status/traces/traces.container.tsx': {
      statements: 92,
      branches: 100,
      functions: 85,
      lines: 91,
    },
    './src/ui/containers/status/traces/trace-detail.container.tsx': {
      statements: 96,
      branches: 86,
      functions: 100,
      lines: 95,
    },
    './src/ui/containers/status/traces/components/TraceFilters.tsx': {
      statements: 47,
      branches: 40,
      functions: 14,
      lines: 47,
    },
    './src/ui/containers/status/traces/components/TraceRow.tsx': {
      statements: 71,
      branches: 42,
      functions: 85,
      lines: 84,
    },
    './src/ui/containers/status/traces/components/TimingWaterfall.tsx': {
      statements: 89,
      branches: 50,
      functions: 100,
      lines: 89,
    },
    './src/ui/containers/status/traces/hooks/useTraces.ts': {
      statements: 77,
      branches: 48,
      functions: 76,
      lines: 80,
    },
  },
};
