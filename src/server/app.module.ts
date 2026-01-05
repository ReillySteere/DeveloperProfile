import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'shared/modules/auth/auth.module';
import { ExperienceModule } from './modules/experience/experience.module';
import { AboutModule } from './modules/about/about.module';
import { Experience } from './modules/experience/experience.entity';
import { Project } from './modules/projects/project.entity';
import { ProjectModule } from './modules/projects/project.module';
import { BlogModule } from './modules/blog/blog.module';
import { BlogPost } from './modules/blog/blog.entity';
import { User } from 'shared/modules/auth/user.entity';
import { SeedingModule } from './modules/seeding/seeding.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/database.sqlite',
      entities: [Experience, Project, BlogPost, User],
      synchronize: true,
    }),
    AuthModule,
    ExperienceModule,
    AboutModule,
    ProjectModule,
    BlogModule,
    SeedingModule,
  ],
})
export class AppModule {}
