import { Injectable } from '@nestjs/common';
import { ExperienceRepository } from './experience.repository';
import { ExperienceEntry } from 'shared/types';

@Injectable()
export class ExperienceService {
  constructor(private readonly repository: ExperienceRepository) {}

  async getExperience(): Promise<ExperienceEntry[]> {
    return this.repository.findAll();
  }
}
