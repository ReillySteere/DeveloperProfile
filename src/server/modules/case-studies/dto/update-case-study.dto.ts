import { PartialType } from '@nestjs/swagger';
import { CreateCaseStudyDto } from './create-case-study.dto';

export class UpdateCaseStudyDto extends PartialType(CreateCaseStudyDto) {}
