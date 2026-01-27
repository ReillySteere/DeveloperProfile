import { DataSource } from 'typeorm';
import { Experience } from '../modules/experience/experience.entity';
import { Project } from '../modules/projects/project.entity';
import { BlogPost } from '../modules/blog/blog.entity';
import { User } from '../shared/modules/auth/user.entity';
import { RequestTrace } from '../modules/traces/trace.entity';
import { AlertHistory } from '../modules/traces/alert-history.entity';
import { RateLimitEntry } from '../modules/rate-limit/rate-limit.entity';

// Import migrations
import { InitialSchema1769265232408 } from '../migrations/1769265232408-InitialSchema';
import { FixProjectsTableName1769267844749 } from '../migrations/1769267844749-FixProjectsTableName';
import { CreateRequestTraceTable1769293753892 } from '../migrations/1769293753892-CreateRequestTraceTable';
import { CreateAlertHistoryTable1769489440468 } from '../migrations/1769489440468-CreateAlertHistoryTable';
import { CreateRateLimitTable1769489275619 } from '../migrations/1769489275619-CreateRateLimitTable';
import { AddAlertHistoryResolvedAtColumn1769489440469 } from '../migrations/1769489440469-AddAlertHistoryResolvedAtColumn';

/**
 * Integration test that verifies migrations create all required tables.
 *
 * This test catches the scenario where:
 * 1. A new entity is added to the codebase
 * 2. No migration is created for it
 * 3. Integration tests pass because they use synchronize: true
 * 4. Production fails because it relies on migrations
 *
 * @see ADR-002: SQLite TypeORM for persistence
 */
describe('Migration Integration', () => {
  let dataSource: DataSource;

  /**
   * All entities that should have corresponding tables after migrations run.
   * When adding a new entity, add it here to ensure a migration exists.
   */
  const ALL_ENTITIES = [
    Experience,
    Project,
    BlogPost,
    User,
    RequestTrace,
    AlertHistory,
    RateLimitEntry,
  ];

  /**
   * All migrations in order. When creating a new migration, add it here.
   */
  const ALL_MIGRATIONS = [
    InitialSchema1769265232408,
    FixProjectsTableName1769267844749,
    CreateRequestTraceTable1769293753892,
    CreateAlertHistoryTable1769489440468,
    CreateRateLimitTable1769489275619,
    AddAlertHistoryResolvedAtColumn1769489440469,
  ];

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
});
