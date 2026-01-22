import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { ExperienceModule } from './modules/experience/experience.module';
import { AboutModule } from './modules/about/about.module';
import { Experience } from './modules/experience/experience.entity';
import { Project } from './modules/projects/project.entity';
import { ProjectModule } from './modules/projects/project.module';
import { BlogModule } from './modules/blog/blog.module';
import { BlogPost } from './modules/blog/blog.entity';
import { AuthModule } from './modules/auth/auth.module';
// Entity import allowed for TypeORM registration per ADR-005
import { User } from 'server/shared/modules/auth/user.entity';
import { SeedingModule } from './modules/seeding/seeding.module';
import { HealthModule } from './modules/health/health.module';
import { LoggerModule } from './shared/modules/logger';
import { ArchitectureModule } from './modules/architecture/architecture.module';

@Module({
  imports: [
    LoggerModule,
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/database.sqlite',
      entities: [Experience, Project, BlogPost, User],
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client'),
      // Exclude API routes from static file serving
      exclude: ['/api/(.*)'],
    }),
    ExperienceModule,
    AboutModule,
    ProjectModule,
    BlogModule,
    AuthModule,
    SeedingModule,
    HealthModule,
    ArchitectureModule,
  ],
})
export class AppModule {}
