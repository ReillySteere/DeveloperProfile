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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/database.sqlite',
      entities: [Experience, Project],
      synchronize: true,
      migrations: [SeedExperience1703289600000, SeedProjects1704153600001],
      migrationsRun: true,
    }),
    AuthModule,
    ExperienceModule,
    AboutModule,
    ProjectModule,
  ],
})
export class AppModule {}
