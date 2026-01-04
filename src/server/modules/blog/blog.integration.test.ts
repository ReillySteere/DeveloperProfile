import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogModule } from './blog.module';
import { BlogPost } from './blog.entity';
import { BlogController } from './blog.controller';
import { SeedBlog1704153600002 } from '../../migrations/1704153600002-SeedBlog';
import { DataSource } from 'typeorm';

describe('Blog Integration', () => {
  let module: TestingModule;
  let controller: BlogController;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [BlogPost],
          synchronize: true,
          migrations: [SeedBlog1704153600002],
          migrationsRun: false,
        }),
        BlogModule,
      ],
    }).compile();

    controller = module.get<BlogController>(BlogController);
    dataSource = module.get<DataSource>(DataSource);

    // Run migrations manually
    await dataSource.runMigrations();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should seed data and return list via controller', async () => {
    const result = await controller.findAll();
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].slug).toBe('hello-world');
    // Should not return full content in list
    expect(result[0].markdownContent).toBeUndefined();
  });

  it('should return full post by slug', async () => {
    const result = await controller.findOne('hello-world');
    expect(result).toBeDefined();
    expect(result.slug).toBe('hello-world');
    expect(result.markdownContent).toBeDefined();
    expect(result.markdownContent).toContain('# Hello World');
  });

  it('should throw error for non-existent slug', async () => {
    await expect(controller.findOne('non-existent')).rejects.toThrow();
  });
});
