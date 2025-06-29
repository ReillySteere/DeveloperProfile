import eslintPluginTs from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import reactCompilerPlugin from 'eslint-plugin-react-compiler';
import pluginRouter from '@tanstack/eslint-plugin-router'

export default [
  {
    ignores: ['**/*.d.ts'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
      },
    },
    plugins: {
      '@tanstack/router': pluginRouter,
      '@typescript-eslint': eslintPluginTs,
      prettier: prettierPlugin,
      'react-compiler': reactCompilerPlugin,
    },
    rules: {
      ...eslintPluginTs.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,
      'react-compiler/react-compiler': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      "prettier/prettier": [
        "error",
        {
          "endOfLine": "auto"
        }
      ],
    },
  },
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      'src/ui/react/test-utils/jest-preloaded.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
