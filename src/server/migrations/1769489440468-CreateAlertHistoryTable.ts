import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the alert_history table for tracking triggered alerts.
 * Supports the alerting feature for cooldown checks and audit trail.
 *
 * @see architecture/features/phase-2-observability/alerting.md
 */
export class CreateAlertHistoryTable1769489440468 implements MigrationInterface {
  name = 'CreateAlertHistoryTable1769489440468';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "alert_history" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "ruleName" varchar NOT NULL,
        "metric" varchar NOT NULL,
        "threshold" real NOT NULL,
        "actualValue" real NOT NULL,
        "triggeredAt" datetime NOT NULL DEFAULT (datetime('now')),
        "channels" text NOT NULL,
        "resolved" boolean NOT NULL DEFAULT (0)
      )
    `);

    // Indexes for common query patterns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alert_history_ruleName" ON "alert_history" ("ruleName")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alert_history_triggeredAt" ON "alert_history" ("triggeredAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_alert_history_triggeredAt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_alert_history_ruleName"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "alert_history"`);
  }
}
