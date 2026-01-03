import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Project } from './project.entity';
import { ProjectModule } from './project.module';
import { ProjectsController } from './projects.controller';
import TOKENS from './tokens';
import { IProjectsService } from './project.service';
import { SeedProjects1704153600001 } from '../../migrations/SeedProjects';

describe('Projects Integration', () => {
  let moduleRef: TestingModule;
  let controller: ProjectsController;
  let service: IProjectsService;
  let dataSource: DataSource;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Project],
          synchronize: true,
          migrations: [SeedProjects1704153600001],
          migrationsRun: false,
        }),
        ProjectModule,
      ],
    }).compile();

    controller = moduleRef.get<ProjectsController>(ProjectsController);
    service = moduleRef.get<IProjectsService>(TOKENS.ProjectsService);
    dataSource = moduleRef.get<DataSource>(DataSource);

    await dataSource.runMigrations();
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

  it('clears projects after rolling back migration', async () => {
    await dataSource.undoLastMigration();
    const projects = await controller.getProjects();
    expect(projects).toEqual([]);
  });
});
