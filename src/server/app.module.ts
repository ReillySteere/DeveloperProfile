import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';

import { ALL_ENTITIES } from './data-source';
import { ALL_MIGRATIONS } from './migrations';
import { AboutModule } from './modules/about/about.module';
import { ApiRootModule } from './modules/api-root/api-root.module';
import { ArchitectureModule } from './modules/architecture/architecture.module';
import { AuthModule } from './modules/auth/auth.module';
import { BlogModule } from './modules/blog/blog.module';
import { CaseStudyModule } from './modules/case-studies/case-study.module';
import { ExperienceModule } from './modules/experience/experience.module';
import { HealthModule } from './modules/health/health.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { ProjectModule } from './modules/projects/project.module';
import { RateLimitModule, RateLimiterGuard } from './modules/rate-limit';
import { SeedingModule } from './modules/seeding/seeding.module';
import { TraceModule } from './modules/traces/trace.module';
import { TracingInterceptor } from './shared/interceptors/tracing.interceptor';
import { LoggerModule } from './shared/modules/logger';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    LoggerModule,
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/database.sqlite',
      entities: ALL_ENTITIES,
      migrations: ALL_MIGRATIONS,
      migrationsRun: isProduction, // Auto-run migrations in production
      synchronize: !isProduction, // Only auto-sync in development
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      // Exclude API routes from static file serving
      exclude: ['/api{/*path}'],
      serveStaticOptions: {
        fallthrough: true,
      },
    }),
    RateLimitModule, // Must be before TraceModule so guard is available
    TraceModule, // Must be before other modules so interceptor is available
    ApiRootModule,
    ExperienceModule,
    AboutModule,
    ProjectModule,
    BlogModule,
    CaseStudyModule,
    AuthModule,
    SeedingModule,
    HealthModule,
    ArchitectureModule,
    PerformanceModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TracingInterceptor,
    },
  ],
})
export class AppModule {}
