import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CaseStudy } from './case-study.entity';
import { ICaseStudyRepository } from './case-study.repository';
import TOKENS from './tokens';
import { CASE_STUDY_EVENTS } from './events';

export interface ICaseStudyService {
  findAll(): Promise<CaseStudy[]>;
  findPublished(): Promise<CaseStudy[]>;
  findBySlug(slug: string): Promise<CaseStudy>;
  findByProjectId(projectId: string): Promise<CaseStudy | null>;
  create(caseStudy: Partial<CaseStudy>): Promise<CaseStudy>;
  update(id: string, caseStudy: Partial<CaseStudy>): Promise<CaseStudy>;
  delete(id: string): Promise<void>;
}

@Injectable()
export class CaseStudyService implements ICaseStudyService {
  readonly #caseStudyRepository: ICaseStudyRepository;
  readonly #eventEmitter: EventEmitter2;

  constructor(
    @Inject(TOKENS.CaseStudyRepository)
    caseStudyRepository: ICaseStudyRepository,
    eventEmitter: EventEmitter2,
  ) {
    this.#caseStudyRepository = caseStudyRepository;
    this.#eventEmitter = eventEmitter;
  }

  findAll(): Promise<CaseStudy[]> {
    return this.#caseStudyRepository.findAll();
  }

  findPublished(): Promise<CaseStudy[]> {
    return this.#caseStudyRepository.findPublished();
  }

  async findBySlug(slug: string): Promise<CaseStudy> {
    const caseStudy = await this.#caseStudyRepository.findBySlug(slug);
    if (!caseStudy) {
      throw new NotFoundException(`Case study with slug "${slug}" not found`);
    }
    return caseStudy;
  }

  findByProjectId(projectId: string): Promise<CaseStudy | null> {
    return this.#caseStudyRepository.findByProjectId(projectId);
  }

  async create(caseStudy: Partial<CaseStudy>): Promise<CaseStudy> {
    const created = await this.#caseStudyRepository.create(caseStudy);
    this.#eventEmitter.emit(CASE_STUDY_EVENTS.CREATED, created);
    return created;
  }

  async update(id: string, caseStudy: Partial<CaseStudy>): Promise<CaseStudy> {
    const updated = await this.#caseStudyRepository.update(id, caseStudy);
    if (!updated) {
      throw new NotFoundException(`Case study with id "${id}" not found`);
    }
    this.#eventEmitter.emit(CASE_STUDY_EVENTS.UPDATED, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.#caseStudyRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Case study with id "${id}" not found`);
    }
    this.#eventEmitter.emit(CASE_STUDY_EVENTS.DELETED, { id });
  }
}
