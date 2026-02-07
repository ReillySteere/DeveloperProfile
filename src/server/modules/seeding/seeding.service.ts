import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experience } from '../experience/experience.entity';
import { Project } from '../projects/project.entity';
import { BlogPost } from '../blog/blog.entity';
import { CaseStudy } from '../case-studies/case-study.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class SeedingService implements OnApplicationBootstrap {
  readonly #logger = new Logger(SeedingService.name);

  readonly #experienceRepo: Repository<Experience>;

  readonly #projectRepo: Repository<Project>;

  readonly #blogRepo: Repository<BlogPost>;

  readonly #caseStudyRepo: Repository<CaseStudy>;

  constructor(
    @InjectRepository(Experience) experienceRepo: Repository<Experience>,

    @InjectRepository(Project) projectRepo: Repository<Project>,

    @InjectRepository(BlogPost) blogRepo: Repository<BlogPost>,

    @InjectRepository(CaseStudy) caseStudyRepo: Repository<CaseStudy>,
  ) {
    this.#experienceRepo = experienceRepo;

    this.#projectRepo = projectRepo;

    this.#blogRepo = blogRepo;

    this.#caseStudyRepo = caseStudyRepo;
  }

  async onApplicationBootstrap() {
    await this.seedExperience();

    await this.seedProjects();

    await this.seedBlogPosts();

    await this.seedCaseStudies();
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

  private async seedCaseStudies() {
    const dataPath = path.join(
      __dirname,
      '../../assets/data/case-studies.json',
    );

    try {
      const count = await this.#caseStudyRepo.count();

      if (count > 0) {
        this.#logger.log('Case studies data already exists. Skipping seed.');

        return;
      }

      const fileContent = await fs.readFile(dataPath, 'utf-8');

      const data = JSON.parse(fileContent);

      // Build a lookup map of project title -> project ID
      const projects = await this.#projectRepo.find();
      const projectMap = new Map(projects.map((p) => [p.title, p.id]));

      await this.#caseStudyRepo.clear();

      for (const item of data) {
        const projectId = projectMap.get(item.projectTitle);

        if (!projectId) {
          this.#logger.warn(
            `No project found with title "${item.projectTitle}" for case study "${item.slug}"`,
          );
          continue;
        }

        // Remove projectTitle from the item since it's not a column
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { projectTitle, ...caseStudyData } = item;

        await this.#caseStudyRepo.save({
          ...caseStudyData,
          id: randomUUID(),
          projectId,
        });
      }

      this.#logger.log(`Seeded ${data.length} case studies.`);
    } catch (error) {
      this.#logger.error('Failed to seed case studies', error);
    }
  }
}
