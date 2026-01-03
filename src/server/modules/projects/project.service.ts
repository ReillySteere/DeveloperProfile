import { Inject, Injectable } from '@nestjs/common';
import { type IProjectsRepository } from './project.repository';
import TOKENS from './tokens';
import { type Project } from 'shared/types';

export interface IProjectsService {
  getProjects(): Promise<Project[]>;
}

@Injectable()
export class ProjectsService implements IProjectsService {
  readonly #repository: IProjectsRepository;

  constructor(
    @Inject(TOKENS.ProjectsRepository)
    repository: IProjectsRepository,
  ) {
    this.#repository = repository;
  }

  async getProjects(): Promise<Project[]> {
    return this.#repository.findAll();
  }
}
