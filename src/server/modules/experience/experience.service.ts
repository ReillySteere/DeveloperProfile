import { Inject, Injectable } from '@nestjs/common';
import { type IExperienceRepository } from './experience.repository';
import { type ExperienceEntry } from 'shared/types';
import TOKENS from './tokens';

export interface IExperienceService {
  getExperience(): Promise<ExperienceEntry[]>;
}

@Injectable()
export class ExperienceService implements IExperienceService {
  readonly #experienceRepository: IExperienceRepository;

  constructor(
    @Inject(TOKENS.ExperienceRepository)
    experienceRepository: IExperienceRepository,
  ) {
    this.#experienceRepository = experienceRepository;
  }

  async getExperience(): Promise<ExperienceEntry[]> {
    return this.#experienceRepository.findAll();
  }
}
