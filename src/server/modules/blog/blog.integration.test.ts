import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogModule } from './blog.module';
import { BlogPost } from './blog.entity';
import { BlogController } from './blog.controller';
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
        }),
        BlogModule,
      ],
    }).compile();

    controller = module.get<BlogController>(BlogController);
    dataSource = module.get<DataSource>(DataSource);

    // Seed data manually
    const repo = dataSource.getRepository(BlogPost);
    await repo.save({
      slug: 'hello-world',
      title: 'Hello World',
      metaDescription: 'Description',
      publishedAt: new Date().toISOString(),
      tags: ['test'],
      content: '# Hello World',
    });
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
    expect(result[0].content).toBeUndefined();
  });

  it('should return full post by slug', async () => {
    const result = await controller.findOne('hello-world');
    expect(result).toBeDefined();
    expect(result.slug).toBe('hello-world');
    expect(result.content).toBeDefined();
    expect(result.content).toContain('# Hello World');
  });

  it('should throw error for non-existent slug', async () => {
    await expect(controller.findOne('non-existent')).rejects.toThrow();
  });
});
