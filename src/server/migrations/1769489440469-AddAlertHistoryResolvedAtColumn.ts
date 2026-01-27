import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds resolvedAt and notes columns to alert_history table.
 * These columns were added to the entity but missing from the original migration.
 */
export class AddAlertHistoryResolvedAtColumn1769489440469 implements MigrationInterface {
  name = 'AddAlertHistoryResolvedAtColumn1769489440469';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add resolvedAt column for tracking when an alert was resolved
    await queryRunner.query(`
      ALTER TABLE "alert_history" ADD COLUMN "resolvedAt" datetime
    `);

    // Add notes column for resolution notes
    await queryRunner.query(`
      ALTER TABLE "alert_history" ADD COLUMN "notes" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite doesn't support DROP COLUMN directly, but we can do it with a table rebuild
    // For simplicity, we'll create a new table without the columns and migrate data
    await queryRunner.query(`
      CREATE TABLE "alert_history_backup" (
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

    await queryRunner.query(`
      INSERT INTO "alert_history_backup" 
      SELECT "id", "ruleName", "metric", "threshold", "actualValue", "triggeredAt", "channels", "resolved"
      FROM "alert_history"
    `);

    await queryRunner.query(`DROP TABLE "alert_history"`);
    await queryRunner.query(
      `ALTER TABLE "alert_history_backup" RENAME TO "alert_history"`,
    );

    // Recreate indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_alert_history_ruleName" ON "alert_history" ("ruleName")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_alert_history_triggeredAt" ON "alert_history" ("triggeredAt")
    `);
  }
}
