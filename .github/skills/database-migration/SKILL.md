---
name: database-migration
description: Create, run, and troubleshoot TypeORM database migrations.
---

# Database Migration

Use this skill when you need to modify the database schema or troubleshoot migration issues.

## 1. Project Database Configuration

### Overview

| Setting         | Value                                 |
| --------------- | ------------------------------------- |
| **Database**    | SQLite                                |
| **ORM**         | TypeORM                               |
| **Location**    | `data/database.sqlite`                |
| **Config**      | `src/server/app.module.ts`            |
| **Data Source** | `src/server/data-source.ts` (for CLI) |
| **Migrations**  | `src/server/migrations/`              |
| **Synchronize** | `true` in dev, `false` in production  |
| **Auto-Run**    | `migrationsRun: true` in production   |

### Current Entities

| Entity       | File                                                 | Purpose            |
| ------------ | ---------------------------------------------------- | ------------------ |
| `User`       | `src/server/shared/modules/auth/user.entity.ts`      | Authentication     |
| `BlogPost`   | `src/server/modules/blog/blog.entity.ts`             | Blog content       |
| `Project`    | `src/server/modules/projects/project.entity.ts`      | Portfolio projects |
| `Experience` | `src/server/modules/experience/experience.entity.ts` | Work history       |

See [database-schema.md](../../architecture/database-schema.md) for the full ERD.

## 2. Development Mode (Auto-Sync)

In development (`NODE_ENV !== 'production'`), the project uses `synchronize: true`, which automatically syncs entity changes to the database schema.

```typescript
// src/server/app.module.ts
const isProduction = process.env.NODE_ENV === 'production';

TypeOrmModule.forRoot({
  type: 'better-sqlite3',
  database: 'data/database.sqlite',
  entities: [Experience, Project, BlogPost, User],
  migrations: ['dist/src/server/migrations/*.js'],
  migrationsRun: isProduction, // Auto-run migrations in production
  synchronize: !isProduction, // Only auto-sync in development
});
```

### When Auto-Sync Works

- Adding new columns
- Adding new entities
- Changing column types (with data loss risk)

### When You Need Migrations

- Production deployments
- Preserving existing data during schema changes
- Complex schema transformations
- Renaming columns (auto-sync would drop and recreate)

## 3. Creating Migrations

### NPM Scripts

The following scripts are available for migration management:

```bash
npm run migration:generate -- MigrationName  # Generate from entity changes
npm run migration:run                         # Apply pending migrations
npm run migration:revert                      # Revert last migration
npm run migration:show                        # Show migration status
```

### Step 1: Generate Migration from Entity Changes

After modifying an entity, generate a migration:

```bash
# This builds first, then generates
npm run migration:generate -- AddViewsColumn
```

### Step 2: Create Empty Migration (Manual)

For custom SQL or complex transformations:

```bash
npx typeorm migration:create src/server/migrations/MigrationName
```

This creates a template:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationName1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Apply changes
    await queryRunner.query(`ALTER TABLE ...`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert changes
    await queryRunner.query(`ALTER TABLE ...`);
  }
}
```

## 4. Running Migrations

### Automatic (on Server Start)

In production (`NODE_ENV=production`), migrations run automatically when the server starts due to `migrationsRun: isProduction`.

### Manual Execution

```bash
# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

## 5. Common Migration Patterns

### Adding a New Column

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    ALTER TABLE blog_post ADD COLUMN views INTEGER DEFAULT 0
  `);
}

public async down(queryRunner: QueryRunner): Promise<void> {
  // SQLite doesn't support DROP COLUMN directly
  // Need to recreate table without the column
  await queryRunner.query(`
    CREATE TABLE blog_post_backup AS SELECT id, slug, title, content FROM blog_post
  `);
  await queryRunner.query(`DROP TABLE blog_post`);
  await queryRunner.query(`ALTER TABLE blog_post_backup RENAME TO blog_post`);
}
```

### Adding a New Entity

1. Create the entity file in the appropriate module
2. Register it in `app.module.ts`:

```typescript
entities: [Experience, Project, BlogPost, User, NewEntity],
```

3. With `synchronize: true`, the table is created automatically
4. For production, generate a migration

### Renaming a Column

SQLite doesn't support `RENAME COLUMN` directly (before version 3.25). Use table recreation:

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Create new table with correct column name
  await queryRunner.query(`
    CREATE TABLE blog_post_new (
      id TEXT PRIMARY KEY,
      slug TEXT,
      headline TEXT  -- renamed from 'title'
    )
  `);

  // Copy data
  await queryRunner.query(`
    INSERT INTO blog_post_new (id, slug, headline)
    SELECT id, slug, title FROM blog_post
  `);

  // Swap tables
  await queryRunner.query(`DROP TABLE blog_post`);
  await queryRunner.query(`ALTER TABLE blog_post_new RENAME TO blog_post`);
}
```

## 6. Troubleshooting

### Error: "no such table"

**Cause:** Table doesn't exist in the database.

**Fixes:**

1. Ensure entity is registered in `app.module.ts`
2. Delete `data/database.sqlite` and restart (dev only)
3. Run migrations if `synchronize: false`

### Error: "SQLITE_CANTOPEN"

**Cause:** Cannot open database file.

**Fixes:**

1. Ensure `data/` directory exists: `mkdir data`
2. Check file permissions
3. Verify path in `app.module.ts`

### Error: "Migration already exists"

**Cause:** Migration with same timestamp already present.

**Fix:** Wait a second and regenerate, or manually rename the file.

### Error: "Cannot find migration"

**Cause:** Migration file not compiled or not in the right location.

**Fixes:**

1. Run `npm run build:server`
2. Check `migrations` path in TypeORM config
3. Verify migration file exports the class correctly

### Data Loss Warning

**When modifying columns:**

- Changing types may cause data loss
- Always backup before running migrations in production
- Test migrations on a copy of production data first

## 7. Best Practices

### DO

- ✅ Test migrations locally before deploying
- ✅ Keep `down()` methods working (for rollback)
- ✅ Use descriptive migration names (e.g., `AddViewsToBlogs`)
- ✅ Backup production database before migrations
- ✅ Review generated SQL before running

### DON'T

- ❌ Use `synchronize: true` in production
- ❌ Modify migrations that have already run in production
- ❌ Delete migration files after they've been applied
- ❌ Assume SQLite supports all SQL features (no DROP COLUMN, etc.)

## 8. Quick Reference

| Task                   | Command                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| Generate migration     | `npx typeorm migration:generate src/server/migrations/Name -d dist/src/server/data-source.js` |
| Create empty migration | `npx typeorm migration:create src/server/migrations/Name`                                     |
| Run migrations         | `npx typeorm migration:run -d dist/src/server/data-source.js`                                 |
| Revert last migration  | `npx typeorm migration:revert -d dist/src/server/data-source.js`                              |
| Show status            | `npx typeorm migration:show -d dist/src/server/data-source.js`                                |
| Reset database (dev)   | `rm data/database.sqlite && npm run start:server:dev`                                         |
