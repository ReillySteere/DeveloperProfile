import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fixes the table name mismatch between the initial migration (which created "project")
 * and the entity definition (which expects "projects" via @Entity({ name: 'projects' })).
 *
 * Handles three scenarios:
 * 1. Only "project" exists -> rename to "projects"
 * 2. Only "projects" exists -> no action needed (already correct)
 * 3. Both exist -> drop "project" (likely empty from sync), keep "projects"
 */
export class FixProjectsTableName1769267844749 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check which tables exist
    const tables = await queryRunner.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('project', 'projects')`,
    );
    const tableNames = tables.map((t: { name: string }) => t.name);
    const hasProject = tableNames.includes('project');
    const hasProjects = tableNames.includes('projects');

    if (hasProject && hasProjects) {
      // Both exist - drop the singular one (likely empty from initial migration)
      await queryRunner.query(`DROP TABLE "project"`);
    } else if (hasProject && !hasProjects) {
      // Only singular exists - rename it
      await queryRunner.query(`ALTER TABLE "project" RENAME TO "projects"`);
    }
    // If only "projects" exists, nothing to do
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // In down, we need to ensure "project" exists (singular)
    const tables = await queryRunner.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('project', 'projects')`,
    );
    const tableNames = tables.map((t: { name: string }) => t.name);
    const hasProjects = tableNames.includes('projects');

    if (hasProjects) {
      await queryRunner.query(`ALTER TABLE "projects" RENAME TO "project"`);
    }
  }
}
