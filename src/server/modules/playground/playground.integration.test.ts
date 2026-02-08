import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PlaygroundModule } from './playground.module';
import { PlaygroundController } from './playground.controller';
import TOKENS from './tokens';
import type { IPlaygroundService } from './playground.service';

describe('Playground Integration', () => {
  let module: TestingModule;
  let app: INestApplication;
  let controller: PlaygroundController;
  let service: IPlaygroundService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PlaygroundModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<PlaygroundController>(PlaygroundController);
    service = module.get<IPlaygroundService>(TOKENS.PlaygroundService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('GET /api/playground/components', () => {
    it('should return component list as array', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/playground/components')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/playground/components/:name', () => {
    it('should return component metadata for existing component', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/playground/components/Button')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Button');
      expect(response.body).toHaveProperty('props');
      expect(response.body).toHaveProperty('category');
    });

    it('should return 404 for non-existent component', async () => {
      await request(app.getHttpServer())
        .get('/api/playground/components/NonExistentComponent')
        .expect(404);
    });
  });

  describe('GET /api/playground/compositions', () => {
    it('should return composition templates as array', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/playground/compositions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/playground/components/:name/docs', () => {
    it('should return 404 for component without docs', async () => {
      await request(app.getHttpServer())
        .get('/api/playground/components/Button/docs')
        .expect(404);
    });

    it('should return 404 for non-existent component docs', async () => {
      await request(app.getHttpServer())
        .get('/api/playground/components/NonExistent/docs')
        .expect(404);
    });
  });
});
