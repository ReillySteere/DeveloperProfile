import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedingService } from './seeding.service';
import { Experience } from '../experience/experience.entity';
import { Project } from '../projects/project.entity';
import { BlogPost } from '../blog/blog.entity';
import { CaseStudy } from '../case-studies/case-study.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Experience, Project, BlogPost, CaseStudy]),
  ],
  providers: [SeedingService],
})
export class SeedingModule {}
