import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './project.service';
import { ProjectsRepository } from './project.repository';
import { Project } from './project.entity';
import TOKENS from './tokens';

@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [ProjectsController],
  providers: [
    {
      provide: TOKENS.ProjectsService,
      useClass: ProjectsService,
    },
    {
      provide: TOKENS.ProjectsRepository,
      useClass: ProjectsRepository,
    },
  ],
})
export class ProjectModule {}
