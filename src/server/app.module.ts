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
import { User } from 'server/shared/modules/auth/user.entity';
import { SeedingModule } from './modules/seeding/seeding.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/database.sqlite',
      entities: [Experience, Project, BlogPost, User],
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client'),
    }),
    ExperienceModule,
    AboutModule,
    ProjectModule,
    BlogModule,
    SeedingModule,
    HealthModule,
  ],
})
export class AppModule {}
