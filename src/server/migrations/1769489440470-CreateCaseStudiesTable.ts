import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the case_studies table for storing detailed project narratives.
 * Uses foreign key to projects table for relationship.
 *
 * @see architecture/plans/PLAN-1.1-interactive-case-study-system.md
 */
export class CreateCaseStudiesTable1769489440470 implements MigrationInterface {
  name = 'CreateCaseStudiesTable1769489440470';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "case_studies" (
        "id" varchar PRIMARY KEY NOT NULL,
        "slug" varchar NOT NULL UNIQUE,
        "projectId" varchar NOT NULL,
        "problemContext" text NOT NULL,
        "challenges" text NOT NULL,
        "approach" text NOT NULL,
        "phases" text NOT NULL,
        "keyDecisions" text NOT NULL,
        "outcomeSummary" text NOT NULL,
        "metrics" text NOT NULL,
        "learnings" text NOT NULL,
        "diagrams" text,
        "codeComparisons" text,
        "published" boolean NOT NULL DEFAULT (0),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_case_studies_project" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Index for slug lookups (already unique, but explicit index helps)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_case_studies_slug" ON "case_studies" ("slug")
    `);

    // Index for project relationship queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_case_studies_projectId" ON "case_studies" ("projectId")
    `);

    // Index for filtering published case studies
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_case_studies_published" ON "case_studies" ("published")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_case_studies_published"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_case_studies_projectId"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_case_studies_slug"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "case_studies"`);
  }
}
