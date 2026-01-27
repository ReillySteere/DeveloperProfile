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
      statements: 97,
      branches: 90,
      functions: 97,
      lines: 98,
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
  },
};
