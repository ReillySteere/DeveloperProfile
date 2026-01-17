import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';
import { HealthModule } from './health.module';

describe('HealthController (Integration)', () => {
  let module: TestingModule;
  let controller: HealthController;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [],
          synchronize: true,
        }),
        HealthModule,
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('check', () => {
    it('should return healthy status when database is connected', () => {
      const result = controller.check();

      expect(result.status).toBe('healthy');
      expect(result.checks.database).toBe('connected');
      expect(result.timestamp).toBeDefined();
    });

    it('should return unhealthy status when database is disconnected', async () => {
      // Get the data source and destroy it to simulate disconnection
      const dataSource = module.get<DataSource>(DataSource);
      await dataSource.destroy();

      const result = controller.check();

      expect(result.status).toBe('unhealthy');
      expect(result.checks.database).toBe('disconnected');

      // Reinitialize for cleanup
      await dataSource.initialize();
    });
  });

  describe('ready', () => {
    it('should return ready status', () => {
      const result = controller.ready();

      expect(result.status).toBe('ready');
    });
  });
});
