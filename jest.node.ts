module.exports = {
  testRegex: '.*/src/(server|shared)/.*\\.test\\.ts$',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(t|j)s$': ['@swc/jest'],
  },
  modulePaths: ['<rootDir>/node_modules'],
  moduleDirectories: [__dirname, 'node_modules', 'test-utils'],
  moduleNameMapper: {
    '\\.([s]*css|woff)': 'identity-obj-proxy',
    '^server/(.*)$': '<rootDir>/src/server/$1',
  },
  setupFilesAfterEnv: ['./src/server/test-utils/jest-node-preloaded.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/shared/**/*.ts',
    'src/server/**/*.ts',
    '!src/shared/types/*',
    '!src/server/migrations/**',
    '!src/server/main.ts',
    '!src/server/data-source.ts',
    '!src/server/test-utils/**',
    '!src/server/app.module.ts',
    '!src/server/**/*.types.ts',
    '!src/server/modules/seeding/**',
    '!src/server/**/index.ts', // Barrel files
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
  },
};
