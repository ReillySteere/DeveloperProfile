import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { join } from 'path';

import { ExperienceModule } from './modules/experience/experience.module';
import { AboutModule } from './modules/about/about.module';
import { ProjectModule } from './modules/projects/project.module';
import { BlogModule } from './modules/blog/blog.module';
import { CaseStudyModule } from './modules/case-studies/case-study.module';
import { AuthModule } from './modules/auth/auth.module';
import { SeedingModule } from './modules/seeding/seeding.module';
import { HealthModule } from './modules/health/health.module';
import { LoggerModule } from './shared/modules/logger';
import { ArchitectureModule } from './modules/architecture/architecture.module';
import { TraceModule } from './modules/traces/trace.module';
import { ApiRootModule } from './modules/api-root/api-root.module';
import { TracingInterceptor } from './shared/interceptors/tracing.interceptor';
import { RateLimitModule, RateLimiterGuard } from './modules/rate-limit';
import { PerformanceModule } from './modules/performance/performance.module';
import { ALL_ENTITIES } from './data-source';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    LoggerModule,
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/database.sqlite',
      entities: ALL_ENTITIES,
      migrations: ['dist/src/server/migrations/*.js'],
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
