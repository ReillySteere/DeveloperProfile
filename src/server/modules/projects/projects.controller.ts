import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { type Project } from 'shared/types';
import { type IProjectsService } from './project.service';
import TOKENS from './tokens';

@ApiTags('Projects')
@Controller('api/projects')
export class ProjectsController {
  readonly #projectsService: IProjectsService;

  constructor(
    @Inject(TOKENS.ProjectsService) projectsService: IProjectsService,
  ) {
    this.#projectsService = projectsService;
  }

  @ApiOperation({ summary: 'Retrieve all projects' })
  @ApiResponse({
    status: 200,
    description: 'List of projects',
  })
  @Get()
  getProjects(): Promise<Project[]> {
    return this.#projectsService.getProjects();
  }
}
