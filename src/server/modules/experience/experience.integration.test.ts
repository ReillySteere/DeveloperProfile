import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExperienceModule } from './experience.module';
import { IExperienceService } from './experience.service';
import { Experience } from './experience.entity';
import { ExperienceController } from './experience.controller';
import { SeedExperience1703289600000 } from '../../migrations/1703289600000-SeedExperience';
import { DataSource } from 'typeorm';
import TOKENS from './tokens';

describe('Experience Integration', () => {
  let module: TestingModule;
  let service: IExperienceService;
  let controller: ExperienceController;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Experience],
          synchronize: true,
          migrations: [SeedExperience1703289600000],
          migrationsRun: false,
        }),
        ExperienceModule,
      ],
    }).compile();

    service = module.get<IExperienceService>(TOKENS.ExperienceService);
    controller = module.get<ExperienceController>(ExperienceController);
    dataSource = module.get<DataSource>(DataSource);

    // Run migrations manually to ensure tables exist first (created by synchronize: true)
    await dataSource.runMigrations();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should seed data and return it via controller', async () => {
    const spy = jest.spyOn(service, 'getExperience');
    const result = await controller.getExperience();
    expect(spy).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);

    const firstItem = result[0];
    expect(firstItem.company).toBeDefined();
    expect(firstItem.role).toBeDefined();
    expect(firstItem.bulletPoints).toBeInstanceOf(Array);
    expect(firstItem.tags).toBeInstanceOf(Array);
  });

  it('should rollback migration and clear data', async () => {
    await dataSource.undoLastMigration();
    const result = await controller.getExperience();
    expect(result).toEqual([]);
  });
});
