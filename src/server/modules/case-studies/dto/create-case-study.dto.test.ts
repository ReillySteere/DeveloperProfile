import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateCaseStudyDto } from './create-case-study.dto';

describe('CreateCaseStudyDto', () => {
  const validData = {
    slug: 'test-case-study',
    projectId: 'uuid-1234',
    problemContext: '# Problem\n\nDescription.',
    challenges: ['Challenge 1', 'Challenge 2'],
    approach: '# Approach\n\nDescription.',
    phases: [
      { name: 'Discovery', description: 'Research phase', duration: '2 weeks' },
      { name: 'Implementation', description: 'Build phase' },
    ],
    keyDecisions: ['Decision 1'],
    outcomeSummary: '# Results\n\nDescription.',
    metrics: [
      {
        label: 'Coverage',
        before: '60%',
        after: '95%',
        description: 'Improved',
      },
      { label: 'Speed', after: '100ms' },
    ],
    learnings: ['Learning 1'],
    diagrams: [
      { type: 'mermaid', content: 'graph TD; A-->B;', caption: 'Architecture' },
      { type: 'image', content: 'https://example.com/image.png' },
    ],
    codeComparisons: [
      {
        title: 'State Management',
        description: 'Migration',
        language: 'typescript',
        before: 'old code',
        after: 'new code',
      },
    ],
    published: true,
  };

  it('should validate a complete valid DTO', async () => {
    const dto = plainToInstance(CreateCaseStudyDto, validData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should validate nested phase objects', async () => {
    const dto = plainToInstance(CreateCaseStudyDto, validData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.phases).toHaveLength(2);
    expect(dto.phases[0].name).toBe('Discovery');
    expect(dto.phases[0].duration).toBe('2 weeks');
    expect(dto.phases[1].duration).toBeUndefined();
  });

  it('should validate nested metric objects', async () => {
    const dto = plainToInstance(CreateCaseStudyDto, validData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.metrics).toHaveLength(2);
    expect(dto.metrics[0].before).toBe('60%');
    expect(dto.metrics[1].before).toBeUndefined();
  });

  it('should validate nested diagram objects', async () => {
    const dto = plainToInstance(CreateCaseStudyDto, validData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.diagrams).toHaveLength(2);
    expect(dto.diagrams![0].type).toBe('mermaid');
    expect(dto.diagrams![1].caption).toBeUndefined();
  });

  it('should validate nested code comparison objects', async () => {
    const dto = plainToInstance(CreateCaseStudyDto, validData);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.codeComparisons).toHaveLength(1);
    expect(dto.codeComparisons![0].title).toBe('State Management');
  });

  it('should reject missing required fields', async () => {
    const dto = plainToInstance(CreateCaseStudyDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const properties = errors.map((e) => e.property);
    expect(properties).toContain('slug');
    expect(properties).toContain('projectId');
    expect(properties).toContain('problemContext');
  });

  it('should allow optional diagrams to be undefined', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { diagrams: _, ...dataWithoutDiagrams } = validData;

    const dto = plainToInstance(CreateCaseStudyDto, dataWithoutDiagrams);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.diagrams).toBeUndefined();
  });

  it('should allow optional codeComparisons to be undefined', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { codeComparisons: _, ...dataWithoutCode } = validData;

    const dto = plainToInstance(CreateCaseStudyDto, dataWithoutCode);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.codeComparisons).toBeUndefined();
  });

  it('should default published to undefined when not provided', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { published: _, ...dataWithoutPublished } = validData;

    const dto = plainToInstance(CreateCaseStudyDto, dataWithoutPublished);
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
