import { Controller, Get, Inject } from '@nestjs/common';
import { type Project } from 'shared/types';
import { type IProjectsService } from './project.service';
import TOKENS from './tokens';

@Controller('api/projects')
export class ProjectsController {
  readonly #projectsService: IProjectsService;

  constructor(
    @Inject(TOKENS.ProjectsService) projectsService: IProjectsService,
  ) {
    this.#projectsService = projectsService;
  }

  @Get()
  getProjects(): Promise<Project[]> {
    return this.#projectsService.getProjects();
  }
}
