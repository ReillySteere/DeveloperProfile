import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the rate_limit_entries table for tracking API request counts.
 * Supports the rate limiting feature to prevent abuse.
 *
 * @see architecture/phase-2-rate-limiting-visualization.md
 */
export class CreateRateLimitTable1769489275619 implements MigrationInterface {
  name = 'CreateRateLimitTable1769489275619';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rate_limit_entries" (
        "key" varchar(512) PRIMARY KEY NOT NULL,
        "count" integer NOT NULL DEFAULT 0,
        "windowStart" bigint NOT NULL,
        "expiresAt" bigint NOT NULL
      )
    `);

    // Index for cleanup queries that filter by expiresAt
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_rate_limit_entries_expiresAt" ON "rate_limit_entries" ("expiresAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_rate_limit_entries_expiresAt"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "rate_limit_entries"`);
  }
}
