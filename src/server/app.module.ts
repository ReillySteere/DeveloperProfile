import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { ExperienceModule } from './modules/experience/experience.module';
import { AboutModule } from './modules/about/about.module';
import { Experience } from './modules/experience/experience.entity';
import { SeedExperience1703289600000 } from './migrations/1703289600000-SeedExperience';
import { Project } from './modules/projects/project.entity';
import { SeedProjects1704153600001 } from './migrations/1704153600001-SeedProjects';
import { ProjectModule } from './modules/projects/project.module';
import { BlogModule } from './modules/blog/blog.module';
import { BlogPost } from './modules/blog/blog.entity';
import { SeedBlog1704153600002 } from './migrations/1704153600002-SeedBlog';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/database.sqlite',
      entities: [Experience, Project, BlogPost],
      synchronize: true,
      migrations: [
        SeedExperience1703289600000,
        SeedProjects1704153600001,
        SeedBlog1704153600002,
      ],
      migrationsRun: true,
    }),
    AuthModule,
    ExperienceModule,
    AboutModule,
    ProjectModule,
    BlogModule,
  ],
})
export class AppModule {}
