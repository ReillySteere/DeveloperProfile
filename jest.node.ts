module.exports = {
  testRegex: '.*/(server|shared)/.*\\.test\\.ts$',
  preset: 'ts-jest/presets/js-with-ts-esm',
  modulePaths: ['<rootDir>/node_modules'],
  moduleDirectories: [__dirname, 'node_modules', 'test-utils'],
  moduleNameMapper: {
    '\\.([s]*css|woff)': 'identity-obj-proxy',
    '^backend/(.*)$': '<rootDir>/src/server/$1',
  },
  setupFilesAfterEnv: ['./src/server/test-utils/jest-node-preloaded.ts'],
  clearMocks: true,
  transform: {
    '.*/(server|shared)/.*\\.test\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        babelConfig: true,
        tsconfig: './tsconfig.jest.json',
      },
    ],
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.jest.json',
      },
    ],
  },
  collectCoverageFrom: [
    'src/shared/**/*.ts',
    'src/server/**/*.ts',
    '!src/shared/types/*',
    '!src/server/main.ts',
    '!src/server/test-utils/**',
    '!src/server/app.module.ts',
    '!src/server/**/*.types.ts',
    '!**/node_modules/**',
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
