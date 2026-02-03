import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseStudy } from './case-study.entity';

export interface ICaseStudyRepository {
  findAll(): Promise<CaseStudy[]>;
  findPublished(): Promise<CaseStudy[]>;
  findBySlug(slug: string): Promise<CaseStudy | null>;
  findById(id: string): Promise<CaseStudy | null>;
  findByProjectId(projectId: string): Promise<CaseStudy | null>;
  create(caseStudy: Partial<CaseStudy>): Promise<CaseStudy>;
  update(id: string, caseStudy: Partial<CaseStudy>): Promise<CaseStudy | null>;
  delete(id: string): Promise<boolean>;
}

@Injectable()
export class CaseStudyRepository implements ICaseStudyRepository {
  readonly #repo: Repository<CaseStudy>;

  constructor(
    @InjectRepository(CaseStudy)
    repo: Repository<CaseStudy>,
  ) {
    this.#repo = repo;
  }

  findAll(): Promise<CaseStudy[]> {
    return this.#repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  findPublished(): Promise<CaseStudy[]> {
    return this.#repo.find({
      where: { published: true },
      order: { createdAt: 'DESC' },
    });
  }

  findBySlug(slug: string): Promise<CaseStudy | null> {
    return this.#repo.findOne({ where: { slug } });
  }

  findById(id: string): Promise<CaseStudy | null> {
    return this.#repo.findOne({ where: { id } });
  }

  findByProjectId(projectId: string): Promise<CaseStudy | null> {
    return this.#repo.findOne({ where: { projectId } });
  }

  create(caseStudy: Partial<CaseStudy>): Promise<CaseStudy> {
    const newCaseStudy = this.#repo.create(caseStudy);
    return this.#repo.save(newCaseStudy);
  }

  async update(
    id: string,
    caseStudy: Partial<CaseStudy>,
  ): Promise<CaseStudy | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    const updated = this.#repo.merge(existing, caseStudy);
    return this.#repo.save(updated);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.#repo.delete(id);
    return Boolean(result.affected && result.affected > 0);
  }
}
