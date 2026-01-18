/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce conventional commit types
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation only
        'style', // Formatting, no code change
        'refactor', // Code refactoring
        'perf', // Performance improvement
        'test', // Adding/updating tests
        'build', // Build system or dependencies
        'ci', // CI configuration
        'chore', // Maintenance tasks
        'revert', // Revert a commit
      ],
    ],
    // Allow longer subject lines for descriptive commits
    'header-max-length': [2, 'always', 100],
    // Require non-empty subject
    'subject-empty': [2, 'never'],
    // Require non-empty type
    'type-empty': [2, 'never'],
  },
};
