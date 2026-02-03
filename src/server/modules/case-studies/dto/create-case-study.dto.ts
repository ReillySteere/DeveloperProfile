import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CaseStudyPhaseDto {
  @ApiProperty({ description: 'Phase name', example: 'Discovery' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Phase description',
    example: 'Research and requirements gathering',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Phase duration',
    example: '2 weeks',
    required: false,
  })
  @IsOptional()
  @IsString()
  duration?: string;
}

class CaseStudyMetricDto {
  @ApiProperty({ description: 'Metric label', example: 'Test Coverage' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
    description: 'Value before change',
    example: '60%',
    required: false,
  })
  @IsOptional()
  @IsString()
  before?: string;

  @ApiProperty({ description: 'Value after change', example: '95%' })
  @IsString()
  @IsNotEmpty()
  after: string;

  @ApiProperty({
    description: 'Additional description',
    example: 'Achieved through integration testing focus',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

class CaseStudyDiagramDto {
  @ApiProperty({
    description: 'Diagram type',
    enum: ['mermaid', 'image'],
    example: 'mermaid',
  })
  @IsString()
  @IsNotEmpty()
  type: 'mermaid' | 'image';

  @ApiProperty({
    description: 'Diagram content (Mermaid syntax or image URL)',
    example: 'graph TD; A-->B;',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Caption for the diagram',
    example: 'System architecture overview',
    required: false,
  })
  @IsOptional()
  @IsString()
  caption?: string;
}

class CodeComparisonDto {
  @ApiProperty({ description: 'Comparison title', example: 'State Management' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Comparison description',
    example: 'Migration from Redux to Zustand',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Programming language',
    example: 'typescript',
  })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({
    description: 'Code before change',
    example: 'const store = createStore(reducer);',
  })
  @IsString()
  @IsNotEmpty()
  before: string;

  @ApiProperty({
    description: 'Code after change',
    example: 'const useStore = create((set) => ({}));',
  })
  @IsString()
  @IsNotEmpty()
  after: string;
}

export class CreateCaseStudyDto {
  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'checkout-migration',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'ID of the associated project',
    example: 'uuid-1234',
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'Problem context in markdown',
    example: '# Background\n\nThe legacy system was...',
  })
  @IsString()
  @IsNotEmpty()
  problemContext: string;

  @ApiProperty({
    description: 'Key challenges faced',
    example: ['Technical debt', 'Tight deadlines'],
  })
  @IsArray()
  @IsString({ each: true })
  challenges: string[];

  @ApiProperty({
    description: 'Solution approach in markdown',
    example: '# Approach\n\nWe decided to...',
  })
  @IsString()
  @IsNotEmpty()
  approach: string;

  @ApiProperty({
    description: 'Implementation phases',
    type: [CaseStudyPhaseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CaseStudyPhaseDto)
  phases: CaseStudyPhaseDto[];

  @ApiProperty({
    description: 'Key architectural decisions',
    example: ['Adopted event-driven architecture', 'Implemented CQRS pattern'],
  })
  @IsArray()
  @IsString({ each: true })
  keyDecisions: string[];

  @ApiProperty({
    description: 'Outcome summary in markdown',
    example: '# Results\n\nThe migration achieved...',
  })
  @IsString()
  @IsNotEmpty()
  outcomeSummary: string;

  @ApiProperty({
    description: 'Measurable outcomes',
    type: [CaseStudyMetricDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CaseStudyMetricDto)
  metrics: CaseStudyMetricDto[];

  @ApiProperty({
    description: 'Key learnings from the project',
    example: ['Early investment in testing pays off', 'Documentation matters'],
  })
  @IsArray()
  @IsString({ each: true })
  learnings: string[];

  @ApiProperty({
    description: 'Interactive diagrams',
    type: [CaseStudyDiagramDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CaseStudyDiagramDto)
  diagrams?: CaseStudyDiagramDto[];

  @ApiProperty({
    description: 'Before/after code comparisons',
    type: [CodeComparisonDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CodeComparisonDto)
  codeComparisons?: CodeComparisonDto[];

  @ApiProperty({
    description: 'Whether the case study is published',
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
