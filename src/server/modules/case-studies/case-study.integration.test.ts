import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseStudyModule } from './case-study.module';
import { CaseStudy } from './case-study.entity';
import { CaseStudyController } from './case-study.controller';
import { DataSource } from 'typeorm';
import { Project } from '../projects/project.entity';

describe('CaseStudy Integration', () => {
  let module: TestingModule;
  let controller: CaseStudyController;
  let dataSource: DataSource;
  let testProject: Project;

  const createTestCaseStudyData = (projectId: string, overrides = {}) => ({
    slug: 'test-case-study',
    projectId,
    problemContext: '# Problem\n\nThe system had issues.',
    challenges: ['Technical debt', 'Legacy code'],
    approach: '# Approach\n\nWe decided to modernize.',
    phases: [
      { name: 'Discovery', description: 'Research phase', duration: '2 weeks' },
      { name: 'Implementation', description: 'Build phase' },
    ],
    keyDecisions: ['Adopt TypeScript', 'Use event-driven architecture'],
    outcomeSummary: '# Results\n\nSignificant improvements achieved.',
    metrics: [
      { label: 'Test Coverage', before: '60%', after: '95%' },
      {
        label: 'Build Time',
        after: '30s',
        description: 'Reduced from 5 minutes',
      },
    ],
    learnings: ['Early testing investment pays off', 'Documentation matters'],
    published: false,
    ...overrides,
  });

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [CaseStudy, Project],
          synchronize: true,
        }),
        CaseStudyModule,
      ],
    }).compile();

    controller = module.get<CaseStudyController>(CaseStudyController);
    dataSource = module.get<DataSource>(DataSource);

    // Seed a project first (required for foreign key)
    const projectRepo = dataSource.getRepository(Project);
    testProject = await projectRepo.save({
      title: 'Test Project',
      shortDescription: 'A test project for case study tests',
      role: 'Technical Lead',
      requirements: ['Requirement 1', 'Requirement 2'],
      execution: ['Step 1', 'Step 2'],
      results: ['Result 1', 'Result 2'],
      technologies: ['TypeScript', 'React'],
      startDate: '2024-01-01',
      endDate: '2024-06-01',
    });

    // Seed a published case study
    const caseStudyRepo = dataSource.getRepository(CaseStudy);
    await caseStudyRepo.save(
      createTestCaseStudyData(testProject.id, {
        slug: 'published-study',
        published: true,
      }),
    );

    // Seed an unpublished case study
    await caseStudyRepo.save(
      createTestCaseStudyData(testProject.id, {
        slug: 'unpublished-study',
        published: false,
      }),
    );
  });

  afterAll(async () => {
    await module.close();
  });

  describe('findAll (list published)', () => {
    it('should return only published case studies', async () => {
      const result = await controller.findAll();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].slug).toBe('published-study');
      expect(result[0].published).toBe(true);
    });

    it('should include project data in results', async () => {
      const result = await controller.findAll();

      expect(result[0].project).toBeDefined();
      expect(result[0].project.title).toBe('Test Project');
    });
  });

  describe('findOne (by slug)', () => {
    it('should return full case study by slug', async () => {
      const result = await controller.findOne('published-study');

      expect(result).toBeDefined();
      expect(result.slug).toBe('published-study');
      expect(result.problemContext).toContain('# Problem');
      expect(result.challenges).toHaveLength(2);
      expect(result.phases).toHaveLength(2);
      expect(result.metrics).toHaveLength(2);
    });

    it('should include project relationship', async () => {
      const result = await controller.findOne('published-study');

      expect(result.project).toBeDefined();
      expect(result.project.title).toBe('Test Project');
      expect(result.project.technologies).toContain('TypeScript');
    });

    it('should throw error for non-existent slug', async () => {
      await expect(controller.findOne('non-existent')).rejects.toThrow(
        'Case study with slug "non-existent" not found',
      );
    });
  });

  describe('findByProjectId', () => {
    it('should return case study for a valid project id', async () => {
      const result = await controller.findByProjectId(testProject.id);

      expect(result).toBeDefined();
      expect(result.projectId).toBe(testProject.id);
      expect(result.project).toBeDefined();
      expect(result.project.title).toBe('Test Project');
    });

    it('should throw error for project with no case study', async () => {
      await expect(
        controller.findByProjectId('non-existent-project-id'),
      ).rejects.toThrow(
        'No case study found for project "non-existent-project-id"',
      );
    });
  });

  describe('create', () => {
    it('should create a new case study', async () => {
      const newCaseStudyData = createTestCaseStudyData(testProject.id, {
        slug: 'new-case-study',
        published: true,
      });

      const created = await controller.create(newCaseStudyData);

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.slug).toBe('new-case-study');
      expect(created.problemContext).toBe(newCaseStudyData.problemContext);
      expect(created.challenges).toEqual(newCaseStudyData.challenges);
      expect(created.phases).toEqual(newCaseStudyData.phases);
    });

    it('should create case study with optional diagrams', async () => {
      const dataWithDiagrams = createTestCaseStudyData(testProject.id, {
        slug: 'study-with-diagrams',
        diagrams: [
          {
            type: 'mermaid',
            content: 'graph TD; A-->B;',
            caption: 'Architecture diagram',
          },
        ],
      });

      const created = await controller.create(dataWithDiagrams);

      expect(created.diagrams).toBeDefined();
      expect(created.diagrams).toHaveLength(1);
      expect(created.diagrams![0].type).toBe('mermaid');
    });

    it('should create case study with optional code comparisons', async () => {
      const dataWithCode = createTestCaseStudyData(testProject.id, {
        slug: 'study-with-code',
        codeComparisons: [
          {
            title: 'State Management',
            language: 'typescript',
            before: 'const store = createStore(reducer);',
            after: 'const useStore = create((set) => ({}));',
            description: 'Migration to Zustand',
          },
        ],
      });

      const created = await controller.create(dataWithCode);

      expect(created.codeComparisons).toBeDefined();
      expect(created.codeComparisons).toHaveLength(1);
      expect(created.codeComparisons![0].title).toBe('State Management');
    });
  });

  describe('update', () => {
    it('should update an existing case study', async () => {
      const existing = await controller.findOne('published-study');

      const updated = await controller.update(existing.id, {
        problemContext: '# Updated Problem\n\nNew context.',
        challenges: ['New challenge 1', 'New challenge 2', 'New challenge 3'],
      });

      expect(updated.problemContext).toBe('# Updated Problem\n\nNew context.');
      expect(updated.challenges).toHaveLength(3);
      // Other fields should remain unchanged
      expect(updated.approach).toContain('# Approach');
    });

    it('should update published status', async () => {
      const existing = await controller.findOne('unpublished-study');
      expect(existing.published).toBe(false);

      const updated = await controller.update(existing.id, {
        published: true,
      });

      expect(updated.published).toBe(true);
    });

    it('should throw error when updating non-existent id', async () => {
      await expect(
        controller.update('non-existent-id', {
          problemContext: 'New context',
        }),
      ).rejects.toThrow('Case study with id "non-existent-id" not found');
    });
  });

  describe('delete', () => {
    it('should delete an existing case study', async () => {
      // Create a case study to delete
      const toDelete = await controller.create(
        createTestCaseStudyData(testProject.id, {
          slug: 'to-delete',
        }),
      );

      // Delete it
      await expect(controller.delete(toDelete.id)).resolves.toBeUndefined();

      // Verify it's gone
      await expect(controller.findOne('to-delete')).rejects.toThrow();
    });

    it('should throw error when deleting non-existent id', async () => {
      await expect(controller.delete('non-existent-id')).rejects.toThrow(
        'Case study with id "non-existent-id" not found',
      );
    });
  });
});
