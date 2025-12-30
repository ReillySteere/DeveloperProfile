import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExperienceController } from './experience.controller';
import { ExperienceService } from './experience.service';
import { ExperienceRepository } from './experience.repository';
import { Experience } from './experience.entity';
import TOKENS from './tokens';

@Module({
  imports: [TypeOrmModule.forFeature([Experience])],
  controllers: [ExperienceController],
  providers: [
    {
      provide: TOKENS.ExperienceService,
      useClass: ExperienceService,
    },
    {
      provide: TOKENS.ExperienceRepository,
      useClass: ExperienceRepository,
    },
  ],
})
export class ExperienceModule {}
