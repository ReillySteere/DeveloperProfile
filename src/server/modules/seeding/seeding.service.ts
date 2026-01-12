import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experience } from '../experience/experience.entity';
import { Project } from '../projects/project.entity';
import { BlogPost } from '../blog/blog.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class SeedingService implements OnApplicationBootstrap {
  readonly #logger = new Logger(SeedingService.name);

  readonly #experienceRepo: Repository<Experience>;

  readonly #projectRepo: Repository<Project>;

  readonly #blogRepo: Repository<BlogPost>;

  constructor(
    @InjectRepository(Experience) experienceRepo: Repository<Experience>,

    @InjectRepository(Project) projectRepo: Repository<Project>,

    @InjectRepository(BlogPost) blogRepo: Repository<BlogPost>,
  ) {
    this.#experienceRepo = experienceRepo;

    this.#projectRepo = projectRepo;

    this.#blogRepo = blogRepo;
  }

  async onApplicationBootstrap() {
    await this.seedExperience();

    await this.seedProjects();

    await this.seedBlogPosts();
  }

  private async seedExperience() {
    const dataPath = path.join(__dirname, '../../assets/data/experience.json');

    try {
      const count = await this.#experienceRepo.count();

      if (count > 0) {
        this.#logger.log('Experience data already exists. Skipping seed.');

        return;
      }

      const fileContent = await fs.readFile(dataPath, 'utf-8');

      const data = JSON.parse(fileContent);

      // Simple strategy: Truncate and Re-insert to ensure DB matches JSON

      // Note: In a real prod app with user data, we would UPSERT based on a unique key.

      // Since this is a profile with static content, this is safe and ensures consistency.

      await this.#experienceRepo.clear();

      for (const item of data) {
        await this.#experienceRepo.save({
          ...item,

          id: randomUUID(), // Generate new ID
        });
      }

      this.#logger.log(`Seeded ${data.length} experience entries.`);
    } catch (error) {
      this.#logger.error('Failed to seed experience', error);
    }
  }

  private async seedProjects() {
    const dataPath = path.join(__dirname, '../../assets/data/projects.json');

    try {
      const count = await this.#projectRepo.count();

      if (count > 0) {
        this.#logger.log('Projects data already exists. Skipping seed.');

        return;
      }

      const fileContent = await fs.readFile(dataPath, 'utf-8');

      const data = JSON.parse(fileContent);

      await this.#projectRepo.clear();

      for (const item of data) {
        await this.#projectRepo.save({
          ...item,

          id: randomUUID(),
        });
      }

      this.#logger.log(`Seeded ${data.length} projects.`);
    } catch (error) {
      this.#logger.error('Failed to seed projects', error);
    }
  }

  private async seedBlogPosts() {
    const dataPath = path.join(__dirname, '../../assets/data/blog-posts.json');

    try {
      const count = await this.#blogRepo.count();

      if (count > 0) {
        this.#logger.log('Blog posts data already exists. Skipping seed.');

        return;
      }

      const fileContent = await fs.readFile(dataPath, 'utf-8');

      const data = JSON.parse(fileContent);

      await this.#blogRepo.clear();

      for (const item of data) {
        await this.#blogRepo.save({
          ...item,

          id: randomUUID(),
        });
      }

      this.#logger.log(`Seeded ${data.length} blog posts.`);
    } catch (error) {
      this.#logger.error('Failed to seed blog posts', error);
    }
  }
}
