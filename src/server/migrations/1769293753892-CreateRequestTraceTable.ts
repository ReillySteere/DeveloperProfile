import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the request_trace table for storing API request telemetry.
 * Supports the observability dashboard feature.
 *
 * @see architecture/components/traces.md
 */
export class CreateRequestTraceTable1769293753892 implements MigrationInterface {
  name = 'CreateRequestTraceTable1769293753892';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "request_trace" (
        "traceId" varchar PRIMARY KEY NOT NULL,
        "method" varchar(10) NOT NULL,
        "path" varchar NOT NULL,
        "statusCode" integer NOT NULL,
        "durationMs" real NOT NULL,
        "timing" text NOT NULL,
        "userId" integer,
        "userAgent" varchar NOT NULL,
        "ip" varchar NOT NULL,
        "timestamp" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Indexes for common query patterns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_request_trace_path" ON "request_trace" ("path")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_request_trace_statusCode" ON "request_trace" ("statusCode")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_request_trace_timestamp" ON "request_trace" ("timestamp")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_request_trace_timestamp"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_request_trace_statusCode"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_request_trace_path"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "request_trace"`);
  }
}
