import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experience } from './experience.entity';

export interface IExperienceRepository {
  findAll(): Promise<Experience[]>;
}

@Injectable()
export class ExperienceRepository implements IExperienceRepository {
  readonly #repo: Repository<Experience>;

  constructor(
    @InjectRepository(Experience)
    repo: Repository<Experience>,
  ) {
    this.#repo = repo;
  }
  findAll(): Promise<Experience[]> {
    return this.#repo.find({
      order: {
        startDate: 'DESC',
      },
    });
  }
}
