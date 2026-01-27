#!/usr/bin/env node
/**
 * Verifies that entities in data-source.ts match entities in app.module.ts
 *
 * This script prevents the scenario where a new entity is added to app.module.ts
 * but forgotten in data-source.ts, which would cause migrations to not be generated
 * for the new table.
 *
 * Run: npm run verify:entities
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

/**
 * Extract entity names from a TypeScript file's entities array
 * @param {string} content - File content
 * @returns {Set<string>} Set of entity names
 */
function extractEntities(content) {
  // Match the entities array in TypeORM configuration
  const entitiesMatch = content.match(/entities:\s*\[([\s\S]*?)\]/);
  if (!entitiesMatch) {
    throw new Error('Could not find entities array');
  }

  const entitiesBlock = entitiesMatch[1];
  // Extract entity names (identifiers before commas or end of array)
  const entityNames = entitiesBlock
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s && /^[A-Z][a-zA-Z]*$/.test(s));

  return new Set(entityNames);
}

function main() {
  console.log('🔍 Verifying entity synchronization...\n');

  // Read both files
  const appModulePath = resolve(rootDir, 'src/server/app.module.ts');
  const dataSourcePath = resolve(rootDir, 'src/server/data-source.ts');

  const appModuleContent = readFileSync(appModulePath, 'utf-8');
  const dataSourceContent = readFileSync(dataSourcePath, 'utf-8');

  // Extract entities from both
  const appModuleEntities = extractEntities(appModuleContent);
  const dataSourceEntities = extractEntities(dataSourceContent);

  console.log(
    `📦 app.module.ts entities: ${[...appModuleEntities].join(', ')}`,
  );
  console.log(
    `📦 data-source.ts entities: ${[...dataSourceEntities].join(', ')}\n`,
  );

  // Find differences
  const missingInDataSource = [...appModuleEntities].filter(
    (e) => !dataSourceEntities.has(e),
  );
  const missingInAppModule = [...dataSourceEntities].filter(
    (e) => !appModuleEntities.has(e),
  );

  let hasErrors = false;

  if (missingInDataSource.length > 0) {
    console.error(
      `❌ Entities in app.module.ts but missing from data-source.ts:`,
    );
    missingInDataSource.forEach((e) => console.error(`   - ${e}`));
    console.error(
      '\n   This will prevent migrations from being generated for these tables.',
    );
    console.error(
      '   Add these entities to data-source.ts and generate migrations.\n',
    );
    hasErrors = true;
  }

  if (missingInAppModule.length > 0) {
    console.error(
      `❌ Entities in data-source.ts but missing from app.module.ts:`,
    );
    missingInAppModule.forEach((e) => console.error(`   - ${e}`));
    console.error(
      '\n   These entities may be orphaned or the app.module.ts is incomplete.\n',
    );
    hasErrors = true;
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log('✅ Entity synchronization verified successfully!');
  console.log(`   ${appModuleEntities.size} entities in sync.`);
}

main();
