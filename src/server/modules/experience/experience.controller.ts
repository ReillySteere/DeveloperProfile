import { Controller, Get } from '@nestjs/common';
import { ExperienceEntry } from 'shared/types';
import { ExperienceService } from './experience.service';

@Controller('api/experience')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Get()
  getExperience(): Promise<ExperienceEntry[]> {
    return this.experienceService.getExperience();
  }
}
