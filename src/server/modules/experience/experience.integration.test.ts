import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExperienceModule } from './experience.module';
import { IExperienceService } from './experience.service';
import { Experience } from './experience.entity';
import { ExperienceController } from './experience.controller';
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
        }),
        ExperienceModule,
      ],
    }).compile();

    service = module.get<IExperienceService>(TOKENS.ExperienceService);
    controller = module.get<ExperienceController>(ExperienceController);
    dataSource = module.get<DataSource>(DataSource);

    // Seed data manually
    const repo = dataSource.getRepository(Experience);
    await repo.insert({
      role: 'Test Role',
      company: 'Test Company',
      description: 'Test Description',
      bulletPoints: ['Point 1'],
      startDate: '2024-01-01',
      tags: ['Tag1'],
    });
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
});
