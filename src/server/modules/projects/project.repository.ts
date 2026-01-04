import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';

export interface IProjectsRepository {
  findAll(): Promise<Project[]>;
}

@Injectable()
export class ProjectsRepository implements IProjectsRepository {
  readonly #repo: Repository<Project>;

  constructor(
    @InjectRepository(Project)
    repo: Repository<Project>,
  ) {
    this.#repo = repo;
  }

  findAll(): Promise<Project[]> {
    return this.#repo.find({
      order: {
        startDate: 'DESC',
      },
    });
  }
}
