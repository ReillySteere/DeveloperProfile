import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CaseStudyRepository,
  ICaseStudyRepository,
} from './case-study.repository';
import { CaseStudy } from './case-study.entity';
import { Project } from '../projects/project.entity';

describe('CaseStudyRepository', () => {
  let repository: ICaseStudyRepository;
  let typeOrmRepo: Repository<CaseStudy>;
  let projectRepo: Repository<Project>;
  let testProject: Project;

  const createTestCaseStudy = (overrides = {}) => ({
    slug: 'test-slug',
    projectId: testProject?.id || 'project-id',
    problemContext: 'Problem context',
    challenges: ['Challenge 1'],
    approach: 'Approach',
    phases: [{ name: 'Phase 1', description: 'Description' }],
    keyDecisions: ['Decision 1'],
    outcomeSummary: 'Summary',
    metrics: [{ label: 'Metric', after: '100%' }],
    learnings: ['Learning 1'],
    published: false,
    ...overrides,
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [CaseStudy, Project],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([CaseStudy, Project]),
      ],
      providers: [CaseStudyRepository],
    }).compile();

    repository = module.get<CaseStudyRepository>(CaseStudyRepository);
    typeOrmRepo = module.get<Repository<CaseStudy>>(
      getRepositoryToken(CaseStudy),
    );
    projectRepo = module.get<Repository<Project>>(getRepositoryToken(Project));

    // Create test project
    testProject = await projectRepo.save({
      title: 'Test Project',
      shortDescription: 'Description',
      role: 'Lead',
      requirements: ['Req 1'],
      execution: ['Exec 1'],
      results: ['Result 1'],
      technologies: ['Tech 1'],
      startDate: '2024-01-01',
    });
  });

  afterAll(async () => {
    await typeOrmRepo.clear();
    await projectRepo.clear();
  });

  describe('findAll', () => {
    it('should return all case studies', async () => {
      // Create test data
      await typeOrmRepo.save(
        createTestCaseStudy({ slug: 'first', projectId: testProject.id }),
      );
      await typeOrmRepo.save(
        createTestCaseStudy({ slug: 'second', projectId: testProject.id }),
      );

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      const slugs = result.map((cs) => cs.slug);
      expect(slugs).toContain('first');
      expect(slugs).toContain('second');
    });
  });

  describe('findByProjectId', () => {
    it('should return case study for given project id', async () => {
      const result = await repository.findByProjectId(testProject.id);

      expect(result).toBeDefined();
      expect(result?.projectId).toBe(testProject.id);
    });

    it('should return null when no case study exists for project', async () => {
      const result = await repository.findByProjectId('non-existent-project');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should return false when no rows affected (item does not exist)', async () => {
      const result = await repository.delete('non-existent-uuid');

      expect(result).toBe(false);
    });
  });
});
