import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';

export interface IProjectsRepository {
  findAll(): Promise<Project[]>;
}

@Injectable()
export class ProjectsRepository implements IProjectsRepository {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
  ) {}

  findAll(): Promise<Project[]> {
    return this.repo.find({
      order: {
        startDate: 'DESC',
      },
    });
  }
}
