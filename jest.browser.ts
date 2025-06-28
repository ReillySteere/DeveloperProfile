module.exports = {
  testRegex: ['./src/ui/.*test\\.[jt]s[x]*$'],
  preset: 'ts-jest/presets/js-with-ts-esm',
  transform: {
    '^.+\\.(ts|tsx)?$': [
      'ts-jest',
      {
        useESM: true,
        babelConfig: true,
        isolatedModules: process.env.ISOLATED_MODULES === 'true',
      },
    ],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^ui/(.*)$': '<rootDir>/src/ui/$1',
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
  modulePaths: ['<rootDir>/node_modules'],
  moduleDirectories: [__dirname, 'node_modules', 'test-utils'],
  setupFilesAfterEnv: ['<rootDir>/src/ui/react/test-utils/jest-preloaded.ts'],
  clearMocks: true,
  testEnvironment: 'jest-fixed-jsdom',
  testEnvironmentOptions: {
    url: 'http://jest',
  },
  collectCoverageFrom: [
    'src/ui/**/*.ts',
    'src/ui/**/*.tsx',
    '!src/react/**/*.types.ts',
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
