import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experience } from './experience.entity';

export interface IExperienceRepository {
  findAll(): Promise<Experience[]>;
}

@Injectable()
export class ExperienceRepository implements IExperienceRepository {
  constructor(
    @InjectRepository(Experience)
    private readonly repo: Repository<Experience>,
  ) {}

  findAll(): Promise<Experience[]> {
    return this.repo.find({
      order: {
        startDate: 'DESC',
      },
    });
  }
}
