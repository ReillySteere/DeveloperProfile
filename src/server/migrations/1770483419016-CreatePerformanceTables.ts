import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the performance_report and bundle_snapshot tables for storing
 * client-side performance metrics and webpack bundle analysis data.
 *
 * @see architecture/decisions/ADR-025-bundle-analysis-integration.md
 */
export class CreatePerformanceTables1770483419016 implements MigrationInterface {
  name = 'CreatePerformanceTables1770483419016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create performance_report table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "performance_report" (
        "id" varchar PRIMARY KEY NOT NULL,
        "sessionId" varchar NOT NULL,
        "pageUrl" varchar NOT NULL,
        "userAgent" varchar NOT NULL,
        "connectionType" varchar,
        "deviceMemory" float,
        "webVitals" text NOT NULL,
        "navigationTiming" text,
        "timestamp" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Index for page URL queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_performance_report_pageUrl" ON "performance_report" ("pageUrl")
    `);

    // Index for timestamp-based queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_performance_report_timestamp" ON "performance_report" ("timestamp")
    `);

    // Create bundle_snapshot table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bundle_snapshot" (
        "id" varchar PRIMARY KEY NOT NULL,
        "buildId" varchar NOT NULL,
        "totalSize" integer NOT NULL,
        "gzippedSize" integer NOT NULL,
        "modules" text NOT NULL,
        "generatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "bundle_snapshot"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_performance_report_timestamp"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_performance_report_pageUrl"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "performance_report"`);
  }
}
