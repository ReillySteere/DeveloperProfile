import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CaseStudyService, ICaseStudyService } from './case-study.service';
import { ICaseStudyRepository } from './case-study.repository';
import TOKENS from './tokens';
import { CaseStudy } from './case-study.entity';
import { NotFoundException } from '@nestjs/common';
import { CASE_STUDY_EVENTS } from './events';

describe('CaseStudyService', () => {
  let service: ICaseStudyService;
  let mockRepository: jest.Mocked<ICaseStudyRepository>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  const mockCaseStudy: Partial<CaseStudy> = {
    id: 'test-id',
    slug: 'test-slug',
    projectId: 'project-id',
    problemContext: 'Problem context',
    challenges: ['Challenge 1'],
    approach: 'Approach',
    phases: [{ name: 'Phase 1', description: 'Description' }],
    keyDecisions: ['Decision 1'],
    outcomeSummary: 'Summary',
    metrics: [{ label: 'Metric', after: '100%' }],
    learnings: ['Learning 1'],
    published: true,
  };

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findPublished: jest.fn(),
      findBySlug: jest.fn(),
      findById: jest.fn(),
      findByProjectId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TOKENS.CaseStudyService,
          useClass: CaseStudyService,
        },
        {
          provide: TOKENS.CaseStudyRepository,
          useValue: mockRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<ICaseStudyService>(TOKENS.CaseStudyService);
  });

  describe('findAll', () => {
    it('should return all case studies from repository', async () => {
      const mockCaseStudies = [mockCaseStudy as CaseStudy];
      mockRepository.findAll.mockResolvedValue(mockCaseStudies);

      const result = await service.findAll();

      expect(result).toBe(mockCaseStudies);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByProjectId', () => {
    it('should return case study for given project id', async () => {
      mockRepository.findByProjectId.mockResolvedValue(
        mockCaseStudy as CaseStudy,
      );

      const result = await service.findByProjectId('project-id');

      expect(result).toBe(mockCaseStudy);
      expect(mockRepository.findByProjectId).toHaveBeenCalledWith('project-id');
    });

    it('should return null when no case study exists for project', async () => {
      mockRepository.findByProjectId.mockResolvedValue(null);

      const result = await service.findByProjectId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should throw NotFoundException when case study not found', async () => {
      mockRepository.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create case study and emit CREATED event', async () => {
      mockRepository.create.mockResolvedValue(mockCaseStudy as CaseStudy);

      const result = await service.create(mockCaseStudy);

      expect(result).toBe(mockCaseStudy);
      expect(mockRepository.create).toHaveBeenCalledWith(mockCaseStudy);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        CASE_STUDY_EVENTS.CREATED,
        mockCaseStudy,
      );
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when case study not found', async () => {
      mockRepository.update.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { problemContext: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update case study and emit UPDATED event', async () => {
      const updatedCaseStudy = {
        ...mockCaseStudy,
        problemContext: 'Updated',
      } as CaseStudy;
      mockRepository.update.mockResolvedValue(updatedCaseStudy);

      const result = await service.update('test-id', {
        problemContext: 'Updated',
      });

      expect(result).toBe(updatedCaseStudy);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        CASE_STUDY_EVENTS.UPDATED,
        updatedCaseStudy,
      );
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException when case study not found', async () => {
      mockRepository.delete.mockResolvedValue(false);

      await expect(service.delete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete case study and emit DELETED event', async () => {
      mockRepository.delete.mockResolvedValue(true);

      await service.delete('test-id');

      expect(mockRepository.delete).toHaveBeenCalledWith('test-id');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        CASE_STUDY_EVENTS.DELETED,
        { id: 'test-id' },
      );
    });
  });
});
