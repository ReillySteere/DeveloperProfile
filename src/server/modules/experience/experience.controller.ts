import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { type ExperienceEntry } from 'shared/types';
import { type IExperienceService } from './experience.service';
import TOKENS from './tokens';

@ApiTags('Experience')
@Controller('api/experience')
export class ExperienceController {
  readonly #experienceService: IExperienceService;

  constructor(
    @Inject(TOKENS.ExperienceService) experienceService: IExperienceService,
  ) {
    this.#experienceService = experienceService;
  }

  @ApiOperation({ summary: 'Retrieve all work experience entries' })
  @ApiResponse({
    status: 200,
    description: 'List of work experience entries',
  })
  @Get()
  getExperience(): Promise<ExperienceEntry[]> {
    return this.#experienceService.getExperience();
  }
}
