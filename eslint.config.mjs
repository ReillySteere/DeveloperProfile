import eslintPluginTs from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import reactCompilerPlugin from 'eslint-plugin-react-compiler';
import pluginRouter from '@tanstack/eslint-plugin-router';
import securityPlugin from 'eslint-plugin-security';

export default [
  {
    ignores: ['**/*.d.ts', '.github/**'],
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
      security: securityPlugin,
    },
    rules: {
      ...eslintPluginTs.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,
      'react-compiler/react-compiler': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'prettier/prettier': 'error',
      // Security rules
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-possible-timing-attacks': 'warn',
    },
  },
  // Enforce Entity decorator only in *.entity.ts files
  {
    files: ['src/server/**/*.ts'],
    ignores: ['**/*.entity.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'typeorm',
              importNames: ['Entity'],
              message:
                'The @Entity decorator can only be used in *.entity.ts files. Create a properly named entity file to ensure migration tests discover it.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.test.tsx',
      'src/ui/test-utils/jest-preloaded.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
