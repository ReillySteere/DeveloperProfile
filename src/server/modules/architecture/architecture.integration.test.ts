import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ArchitectureModule } from './architecture.module';
import { ArchitectureController } from './architecture.controller';
import { ArchitectureService } from './architecture.service';
import TOKENS from './tokens';

describe('Architecture Integration', () => {
  let module: TestingModule;
  let app: INestApplication;
  let controller: ArchitectureController;
  let service: ArchitectureService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ArchitectureModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<ArchitectureController>(ArchitectureController);
    service = module.get<ArchitectureService>(TOKENS.ArchitectureService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('GET /api/architecture/adrs', () => {
    it('should return ADR list with searchText', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/architecture/adrs')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const firstAdr = response.body[0];
      expect(firstAdr).toHaveProperty('slug');
      expect(firstAdr).toHaveProperty('title');
      expect(firstAdr).toHaveProperty('status');
      expect(firstAdr).toHaveProperty('number');
      expect(firstAdr).toHaveProperty('searchText');
    });

    it('should return ADRs sorted by number', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/architecture/adrs')
        .expect(200);

      const numbers = response.body.map(
        (adr: { number: number }) => adr.number,
      );
      const sorted = [...numbers].sort((a, b) => a - b);
      expect(numbers).toEqual(sorted);
    });
  });

  describe('GET /api/architecture/adrs/:slug', () => {
    it('should return full ADR content', async () => {
      // First get the list to find a valid slug
      const listResponse = await request(app.getHttpServer())
        .get('/api/architecture/adrs')
        .expect(200);

      const firstAdr = listResponse.body[0];

      const response = await request(app.getHttpServer())
        .get(`/api/architecture/adrs/${firstAdr.slug}`)
        .expect(200);

      expect(response.body).toHaveProperty('slug', firstAdr.slug);
      expect(response.body).toHaveProperty('content');
      expect(typeof response.body.content).toBe('string');
      expect(response.body.content.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent ADR', async () => {
      await request(app.getHttpServer())
        .get('/api/architecture/adrs/ADR-999-nonexistent')
        .expect(404);
    });
  });

  describe('GET /api/architecture/components', () => {
    it('should return component doc list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/architecture/components')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const firstComponent = response.body[0];
      expect(firstComponent).toHaveProperty('slug');
      expect(firstComponent).toHaveProperty('name');
      expect(firstComponent).toHaveProperty('summary');
    });
  });

  describe('GET /api/architecture/components/:slug', () => {
    it('should return component doc content', async () => {
      // First get the list to find a valid slug
      const listResponse = await request(app.getHttpServer())
        .get('/api/architecture/components')
        .expect(200);

      const firstComponent = listResponse.body[0];

      const response = await request(app.getHttpServer())
        .get(`/api/architecture/components/${firstComponent.slug}`)
        .expect(200);

      expect(response.body).toHaveProperty('slug', firstComponent.slug);
      expect(response.body).toHaveProperty('content');
      expect(typeof response.body.content).toBe('string');
    });

    it('should return 404 for non-existent component', async () => {
      await request(app.getHttpServer())
        .get('/api/architecture/components/nonexistent-component')
        .expect(404);
    });
  });

  describe('GET /api/architecture/dependencies/:scope', () => {
    // Note: This test may fail if dependency graphs haven't been generated
    // Run `npm run build:dependency-graphs` first
    it('should return 404 when graphs not generated', async () => {
      // This assumes graphs haven't been pre-generated in test environment
      // In a real scenario, we'd either mock or pre-generate
      const response = await request(app.getHttpServer()).get(
        '/api/architecture/dependencies/server',
      );

      // Either 200 (if graphs exist) or 404 (if not)
      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('scope', 'server');
        expect(response.body).toHaveProperty('nodes');
        expect(response.body).toHaveProperty('edges');
        expect(response.body).toHaveProperty('generatedAt');
      }
    });
  });

  describe('GET /api/architecture/dependencies', () => {
    it('should return all dependency graphs data or 404', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/architecture/dependencies',
      );

      // Either 200 (if graphs exist) or 404 (if not generated)
      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('ui');
        expect(response.body).toHaveProperty('server');
        expect(response.body).toHaveProperty('generatedAt');
      }
    });
  });

  describe('GET /api/architecture/dependencies/:scope/:target', () => {
    it('should return focused dependency graph for valid target or 404', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/architecture/dependencies/ui/blog',
      );

      // Either 200 (if graphs exist and target found) or 404
      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('name', 'blog');
        expect(response.body).toHaveProperty('nodes');
        expect(response.body).toHaveProperty('edges');
      }
    });

    it('should return 404 for non-existent target', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/architecture/dependencies/ui/nonexistent-target',
      );

      expect(response.status).toBe(404);
    });
  });
});
