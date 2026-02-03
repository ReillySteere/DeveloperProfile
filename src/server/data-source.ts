import { DataSource } from 'typeorm';
import { Experience } from './modules/experience/experience.entity';
import { Project } from './modules/projects/project.entity';
import { BlogPost } from './modules/blog/blog.entity';
import { User } from './shared/modules/auth/user.entity';
import { RequestTrace } from './modules/traces/trace.entity';
import { AlertHistory } from './modules/traces/alert-history.entity';
import { RateLimitEntry } from './modules/rate-limit/rate-limit.entity';
import { CaseStudy } from './modules/case-studies/case-study.entity';

/**
 * TypeORM CLI Data Source Configuration
 *
 * This file is used by the TypeORM CLI for migration commands:
 * - `npm run migration:generate` - Generate migration from entity changes
 * - `npm run migration:run` - Apply pending migrations
 * - `npm run migration:revert` - Revert last migration
 * - `npm run migration:show` - Show migration status
 *
 * Note: The application uses the configuration in app.module.ts at runtime.
 * This file mirrors that configuration for CLI compatibility.
 *
 * IMPORTANT: All entities in app.module.ts must also be listed here,
 * otherwise migrations will not be generated for them.
 */
export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: 'data/database.sqlite',
  entities: [
    Experience,
    Project,
    BlogPost,
    User,
    RequestTrace,
    AlertHistory,
    RateLimitEntry,
    CaseStudy,
  ],
  migrations: ['dist/src/server/migrations/*.js'],
  synchronize: false,
  logging: false,
});
