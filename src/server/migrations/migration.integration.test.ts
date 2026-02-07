import { DataSource } from 'typeorm';
import { glob } from 'glob';
import path from 'path';
import { ALL_ENTITIES } from '../data-source';
import { ALL_MIGRATIONS } from './index';

/**
 * Integration test that verifies migrations create all required tables.
 *
 * This test catches the scenario where:
 * 1. A new entity is added to data-source.ts (ALL_ENTITIES)
 * 2. No migration is created for it
 * 3. Integration tests pass because they use synchronize: true
 * 4. Production fails because it relies on migrations
 *
 * The test imports entities from data-source.ts and migrations from index.ts,
 * ensuring we test against the ACTUAL registered entities, not a duplicate list.
 *
 * @see ADR-002: SQLite TypeORM for persistence
 */
describe('Migration Integration', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    // Create a fresh in-memory database WITHOUT synchronize
    // This simulates production behavior where only migrations create tables
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: ALL_ENTITIES,
      migrations: ALL_MIGRATIONS,
      synchronize: false, // Critical: must be false to test migrations
      logging: false,
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('should run all migrations successfully', async () => {
    const pendingMigrations = await dataSource.showMigrations();
    // showMigrations returns true if there are pending migrations
    expect(pendingMigrations).toBe(true);

    // Run migrations
    const executedMigrations = await dataSource.runMigrations();
    expect(executedMigrations.length).toBe(ALL_MIGRATIONS.length);

    // Verify no more pending migrations
    const stillPending = await dataSource.showMigrations();
    expect(stillPending).toBe(false);
  });

  it('should create tables for all registered entities', async () => {
    const queryRunner = dataSource.createQueryRunner();

    try {
      // Get all table names in the database
      const tables = await queryRunner.query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'migrations'
      `);
      const tableNames = new Set(tables.map((t: { name: string }) => t.name));

      // Verify each entity has a corresponding table
      const missingTables: string[] = [];
      for (const entity of ALL_ENTITIES) {
        const metadata = dataSource.getMetadata(entity);
        const tableName = metadata.tableName;

        if (!tableNames.has(tableName)) {
          missingTables.push(tableName);
        }
      }

      expect(missingTables).toEqual([]);
    } finally {
      await queryRunner.release();
    }
  });

  it('should have correct schema for rate_limit_entries table', async () => {
    const queryRunner = dataSource.createQueryRunner();

    try {
      const columns = await queryRunner.query(`
        PRAGMA table_info(rate_limit_entries)
      `);

      const columnNames = columns.map((c: { name: string }) => c.name);

      expect(columnNames).toContain('key');
      expect(columnNames).toContain('count');
      expect(columnNames).toContain('windowStart');
      expect(columnNames).toContain('expiresAt');
    } finally {
      await queryRunner.release();
    }
  });

  it('should have index on rate_limit_entries.expiresAt', async () => {
    const queryRunner = dataSource.createQueryRunner();

    try {
      const indexes = await queryRunner.query(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND tbl_name='rate_limit_entries'
      `);

      const indexNames = indexes.map((i: { name: string }) => i.name);
      expect(
        indexNames.some((name: string) => name.includes('expiresAt')),
      ).toBe(true);
    } finally {
      await queryRunner.release();
    }
  });

  it('should have correct schema for alert_history table', async () => {
    const queryRunner = dataSource.createQueryRunner();

    try {
      const columns = await queryRunner.query(`
        PRAGMA table_info(alert_history)
      `);

      const columnNames = columns.map((c: { name: string }) => c.name);

      // Core columns from original migration
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('ruleName');
      expect(columnNames).toContain('metric');
      expect(columnNames).toContain('threshold');
      expect(columnNames).toContain('actualValue');
      expect(columnNames).toContain('triggeredAt');
      expect(columnNames).toContain('channels');
      expect(columnNames).toContain('resolved');

      // Columns added in follow-up migration
      expect(columnNames).toContain('resolvedAt');
      expect(columnNames).toContain('notes');
    } finally {
      await queryRunner.release();
    }
  });

  it('should have correct schema for case_studies table', async () => {
    const queryRunner = dataSource.createQueryRunner();

    try {
      const columns = await queryRunner.query(`
        PRAGMA table_info(case_studies)
      `);

      const columnNames = columns.map((c: { name: string }) => c.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('slug');
      expect(columnNames).toContain('projectId');
      expect(columnNames).toContain('problemContext');
      expect(columnNames).toContain('challenges');
      expect(columnNames).toContain('approach');
      expect(columnNames).toContain('phases');
      expect(columnNames).toContain('keyDecisions');
      expect(columnNames).toContain('outcomeSummary');
      expect(columnNames).toContain('metrics');
      expect(columnNames).toContain('learnings');
      expect(columnNames).toContain('diagrams');
      expect(columnNames).toContain('codeComparisons');
      expect(columnNames).toContain('published');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    } finally {
      await queryRunner.release();
    }
  });

  it('should have indexes on case_studies table', async () => {
    const queryRunner = dataSource.createQueryRunner();

    try {
      const indexes = await queryRunner.query(`
        SELECT name FROM sqlite_master
        WHERE type='index' AND tbl_name='case_studies'
      `);

      const indexNames = indexes.map((i: { name: string }) => i.name);
      expect(indexNames.some((name: string) => name.includes('slug'))).toBe(
        true,
      );
      expect(
        indexNames.some((name: string) => name.includes('projectId')),
      ).toBe(true);
      expect(
        indexNames.some((name: string) => name.includes('published')),
      ).toBe(true);
    } finally {
      await queryRunner.release();
    }
  });
});

/**
 * Test that ensures all entity files in the codebase are registered in ALL_ENTITIES.
 *
 * This catches the scenario where:
 * 1. A developer creates a new *.entity.ts file
 * 2. Forgets to add it to ALL_ENTITIES in data-source.ts
 * 3. Dev mode works because synchronize:true creates the table
 * 4. Production fails because TypeORM doesn't know about the entity
 */
describe('Entity Registration', () => {
  it('should have all entity files registered in ALL_ENTITIES', async () => {
    // Find all *.entity.ts files in the server directory
    const serverDir = path.resolve(__dirname, '..');
    const entityFiles = await glob('**/*.entity.ts', {
      cwd: serverDir,
      ignore: ['**/*.test.ts', '**/node_modules/**'],
    });

    // Get the names of all registered entities
    const registeredEntityNames = new Set(
      ALL_ENTITIES.map((entity) => entity.name),
    );

    // Extract entity class names from file paths
    // e.g., "modules/blog/blog.entity.ts" -> expect "BlogPost" or similar
    const unregisteredFiles: string[] = [];

    for (const file of entityFiles) {
      // Import the entity file dynamically to get exported classes
      const filePath = path.join(serverDir, file);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module = require(filePath);

      // Check each export - if it's a class with @Entity decorator, it should be registered
      let hasRegisteredEntity = false;
      for (const exportName of Object.keys(module)) {
        const exported = module[exportName];
        if (
          typeof exported === 'function' &&
          registeredEntityNames.has(exported.name)
        ) {
          hasRegisteredEntity = true;
        }
      }

      // If no exports from this file are in ALL_ENTITIES, flag it
      if (!hasRegisteredEntity) {
        unregisteredFiles.push(file);
      }
    }

    expect(unregisteredFiles).toEqual([]);
  });
});
