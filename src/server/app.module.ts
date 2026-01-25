import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { TraceModule } from './modules/traces/trace.module';
import { RequestTrace } from './modules/traces/trace.entity';
import { TracingInterceptor } from './shared/interceptors/tracing.interceptor';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    LoggerModule,
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/database.sqlite',
      entities: [Experience, Project, BlogPost, User, RequestTrace],
      migrations: ['dist/src/server/migrations/*.js'],
      migrationsRun: isProduction, // Auto-run migrations in production
      synchronize: !isProduction, // Only auto-sync in development
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client'),
      // Exclude API routes from static file serving
      exclude: ['/api{/*path}'],
    }),
    TraceModule, // Must be before other modules so interceptor is available
    ExperienceModule,
    AboutModule,
    ProjectModule,
    BlogModule,
    AuthModule,
    SeedingModule,
    HealthModule,
    ArchitectureModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TracingInterceptor,
    },
  ],
})
export class AppModule {}
