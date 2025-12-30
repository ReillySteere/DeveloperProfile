import { Controller, Get, Inject } from '@nestjs/common';
import { type ExperienceEntry } from 'shared/types';
import { type IExperienceService } from './experience.service';
import TOKENS from './tokens';

@Controller('api/experience')
export class ExperienceController {
  readonly #experienceService: IExperienceService;

  constructor(
    @Inject(TOKENS.ExperienceService) experienceService: IExperienceService,
  ) {
    this.#experienceService = experienceService;
  }

  @Get()
  getExperience(): Promise<ExperienceEntry[]> {
    return this.#experienceService.getExperience();
  }
}
