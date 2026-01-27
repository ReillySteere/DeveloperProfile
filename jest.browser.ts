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
    '!src/ui/shared/components/index.ts', // Barrel file
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageReporters: ['html', 'text', 'text-summary', 'cobertura'],
  coverageThreshold: {
    global: {
      statements: 98,
      branches: 92,
      functions: 98,
      lines: 98,
    },
  },
};
