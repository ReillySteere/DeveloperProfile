import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Project } from './project.entity';
import { ProjectModule } from './project.module';
import { ProjectsController } from './projects.controller';
import TOKENS from './tokens';
import { IProjectsService } from './project.service';

describe('Projects Integration', () => {
  let moduleRef: TestingModule;
  let controller: ProjectsController;
  let service: IProjectsService;
  let dataSource: DataSource;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [Project],
          synchronize: true,
        }),
        ProjectModule,
      ],
    }).compile();

    controller = moduleRef.get<ProjectsController>(ProjectsController);
    service = moduleRef.get<IProjectsService>(TOKENS.ProjectsService);
    dataSource = moduleRef.get<DataSource>(DataSource);

    // Seed data manually
    const repo = dataSource.getRepository(Project);
    await repo.insert({
      title: 'Test Project',
      shortDescription: 'Test Description',
      role: 'Test Role',
      requirements: ['Req 1'],
      execution: ['Exec 1'],
      results: ['Res 1'],
      technologies: ['Tech 1'],
      startDate: '2024-01-01',
    });
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('returns seeded projects via controller', async () => {
    const spy = jest.spyOn(service, 'getProjects');
    const projects = await controller.getProjects();

    expect(spy).toHaveBeenCalled();
    expect(projects).toBeDefined();
    expect(projects.length).toBeGreaterThan(0);

    const [first] = projects;
    expect(first.title).toBeDefined();
    expect(Array.isArray(first.requirements)).toBe(true);
    expect(Array.isArray(first.execution)).toBe(true);
    expect(Array.isArray(first.results)).toBe(true);
    expect(Array.isArray(first.technologies)).toBe(true);

    const startDates = projects.map((project) => project.startDate);
    const sortedDates = [...startDates].sort((a, b) => (a > b ? -1 : 1));
    expect(startDates).toEqual(sortedDates);
    spy.mockRestore();
  });
});
