#!/usr/bin/env node
/**
 * Migration Idempotency Verification Script
 *
 * This script scans all TypeORM migrations and verifies that any migration
 * performing ALTER TABLE operations includes idempotency checks.
 *
 * WHY THIS EXISTS:
 * - Development uses `synchronize: true` which auto-creates schema
 * - Migrations may run on databases where changes already exist
 * - Non-idempotent migrations (e.g., ADD COLUMN without IF NOT EXISTS check)
 *   will crash in production with "duplicate column" errors
 *
 * WHAT IT CHECKS:
 * - Migrations with ALTER TABLE ... ADD COLUMN must have PRAGMA table_info checks
 * - Migrations with CREATE INDEX must use IF NOT EXISTS
 * - Migrations with CREATE TABLE must use IF NOT EXISTS
 *
 * USAGE:
 *   npm run verify:migrations
 *   node scripts/verify-migrations.mjs
 *
 * @see ADR-002: SQLite TypeORM for persistence
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '../src/server/migrations');

// Patterns that require idempotency checks
const REQUIRES_CHECK = [
  {
    name: 'ALTER TABLE ADD COLUMN',
    pattern:
      /ALTER\s+TABLE\s+["']?\w+["']?\s+ADD\s+(?:COLUMN\s+)?["']?(\w+)["']?/gi,
    requiredPattern: /PRAGMA\s+table_info/i,
    fix: 'Add PRAGMA table_info check before ALTER TABLE ADD COLUMN',
  },
];

// Patterns that should use IF NOT EXISTS
const SHOULD_USE_IF_NOT_EXISTS = [
  {
    name: 'CREATE INDEX',
    pattern: /CREATE\s+INDEX\s+(?!IF\s+NOT\s+EXISTS)/gi,
    fix: 'Use CREATE INDEX IF NOT EXISTS',
  },
  {
    name: 'CREATE TABLE',
    pattern: /CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/gi,
    fix: 'Use CREATE TABLE IF NOT EXISTS',
    // Exception: backup tables in down() migrations are OK
    exceptions: [/_backup/i],
  },
];

/**
 * Check if a file path is a migration file (not a test file)
 */
function isMigrationFile(filePath) {
  const fileName = basename(filePath);
  return (
    fileName.endsWith('.ts') &&
    !fileName.includes('.test.') &&
    !fileName.includes('.spec.') &&
    /^\d+-/.test(fileName) // Migrations start with timestamp
  );
}

/**
 * Extract the up() method content from a migration file
 */
function extractUpMethod(content) {
  // Match the up() method body
  const upMatch = content.match(
    /public\s+async\s+up\s*\([^)]*\)\s*:\s*Promise<void>\s*\{([\s\S]*?)^\s*\}/m,
  );
  return upMatch ? upMatch[1] : content;
}

/**
 * Check a single migration file for idempotency issues
 */
function checkMigration(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const upContent = extractUpMethod(content);
  const fileName = basename(filePath);
  const issues = [];

  // Check patterns that require idempotency checks
  for (const check of REQUIRES_CHECK) {
    const matches = upContent.match(check.pattern);
    if (matches && matches.length > 0) {
      // Verify the required pattern exists
      if (!check.requiredPattern.test(upContent)) {
        issues.push({
          file: fileName,
          issue: `Found ${check.name} without idempotency check`,
          matches: matches,
          fix: check.fix,
        });
      }
    }
  }

  // Check patterns that should use IF NOT EXISTS
  for (const check of SHOULD_USE_IF_NOT_EXISTS) {
    const matches = upContent.match(check.pattern);
    if (matches && matches.length > 0) {
      // Filter out exceptions
      const filteredMatches = matches.filter((match) => {
        if (check.exceptions) {
          return !check.exceptions.some((exc) => exc.test(match));
        }
        return true;
      });

      if (filteredMatches.length > 0) {
        issues.push({
          file: fileName,
          issue: `Found ${check.name} without IF NOT EXISTS`,
          matches: filteredMatches,
          fix: check.fix,
        });
      }
    }
  }

  return issues;
}

/**
 * Main verification function
 */
function verifyMigrations() {
  console.log('🔍 Verifying migration idempotency...\n');

  let migrationFiles;
  try {
    migrationFiles = readdirSync(MIGRATIONS_DIR)
      .filter((file) => isMigrationFile(join(MIGRATIONS_DIR, file)))
      .map((file) => join(MIGRATIONS_DIR, file));
  } catch (error) {
    console.error(`❌ Could not read migrations directory: ${error.message}`);
    process.exit(1);
  }

  if (migrationFiles.length === 0) {
    console.log('⚠️  No migration files found');
    process.exit(0);
  }

  console.log(`Found ${migrationFiles.length} migration file(s)\n`);

  const allIssues = [];

  for (const filePath of migrationFiles) {
    const issues = checkMigration(filePath);
    allIssues.push(...issues);
  }

  if (allIssues.length === 0) {
    console.log('✅ All migrations pass idempotency checks!\n');
    console.log('Verified patterns:');
    console.log('  • ALTER TABLE ADD COLUMN has PRAGMA table_info check');
    console.log('  • CREATE INDEX uses IF NOT EXISTS');
    console.log('  • CREATE TABLE uses IF NOT EXISTS');
    process.exit(0);
  }

  console.log(`❌ Found ${allIssues.length} idempotency issue(s):\n`);

  for (const issue of allIssues) {
    console.log(`  📁 ${issue.file}`);
    console.log(`     Issue: ${issue.issue}`);
    console.log(`     Fix: ${issue.fix}`);
    if (issue.matches) {
      console.log(
        `     Found: ${issue.matches.slice(0, 3).join(', ')}${issue.matches.length > 3 ? '...' : ''}`,
      );
    }
    console.log('');
  }

  console.log('💡 Why this matters:');
  console.log(
    '   Development uses synchronize:true which may auto-create schema.',
  );
  console.log(
    '   Migrations must be idempotent to avoid "duplicate column" errors',
  );
  console.log(
    '   when running against databases with pre-existing schema changes.\n',
  );

  process.exit(1);
}

verifyMigrations();
