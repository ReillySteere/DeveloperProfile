import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema migration - baseline for production deployments.
 *
 * This migration creates all tables from scratch for fresh databases.
 * For existing databases created with synchronize:true, this migration
 * will be skipped as the tables already exist.
 *
 * Entities: User, BlogPost, Project, Experience
 * See: architecture/database-schema.md for ERD
 */
export class InitialSchema1769265232408 implements MigrationInterface {
  name = 'InitialSchema1769265232408';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // User table (authentication)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "userId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "username" varchar NOT NULL,
        "password" varchar NOT NULL,
        CONSTRAINT "UQ_user_username" UNIQUE ("username")
      )
    `);

    // BlogPost table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "blog_post" (
        "id" varchar PRIMARY KEY NOT NULL,
        "slug" varchar NOT NULL,
        "title" varchar NOT NULL,
        "metaDescription" varchar NOT NULL,
        "publishedAt" varchar NOT NULL,
        "tags" text NOT NULL,
        "content" text NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_blog_post_slug" UNIQUE ("slug")
      )
    `);

    // Project table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project" (
        "id" varchar PRIMARY KEY NOT NULL,
        "title" varchar NOT NULL,
        "shortDescription" text NOT NULL,
        "role" varchar NOT NULL,
        "requirements" text NOT NULL,
        "execution" text NOT NULL,
        "results" text NOT NULL,
        "technologies" text NOT NULL,
        "startDate" varchar NOT NULL,
        "endDate" varchar
      )
    `);

    // Experience table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "experience" (
        "id" varchar PRIMARY KEY NOT NULL,
        "company" varchar NOT NULL,
        "role" varchar NOT NULL,
        "description" varchar NOT NULL,
        "startDate" varchar NOT NULL,
        "endDate" varchar,
        "bulletPoints" text NOT NULL,
        "tags" text NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "experience"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "project"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blog_post"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user"`);
  }
}
