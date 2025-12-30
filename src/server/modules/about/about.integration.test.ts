import { Test, TestingModule } from '@nestjs/testing';
import { AboutModule } from './about.module';
import { AboutController } from './about.controller';
import { AboutService } from './about.service';
import TOKENS from './tokens';
import { StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { Readable } from 'stream';

describe('About Integration', () => {
  let module: TestingModule;
  let controller: AboutController;
  let service: AboutService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AboutModule],
    }).compile();

    controller = module.get<AboutController>(AboutController);
    service = module.get<AboutService>(TOKENS.AboutService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should return a StreamableFile with correct headers', async () => {
    const mockResponse = {
      setHeader: jest.fn(),
    } as unknown as Response;

    // Mock the service to avoid actual file system operations during test if desired,
    // but for integration tests, we might want to test the actual service or a mock that simulates it closely.
    // However, AboutService reads from the file system.
    // Let's spy on the service to ensure it's called.
    const getResumeSpy = jest.spyOn(service, 'getResume');

    // We need to mock the implementation of getResume if the file doesn't exist in the test environment
    // or if we want to avoid FS dependency.
    // Given the instructions "comprehensive integration test", usually implies testing the full stack.
    // But reading a real file might be flaky if the file is missing.
    // Let's check if we should mock the file reading or not.
    // The AboutService uses `process.cwd()` and `src/server/assets`.
    // Let's mock the service implementation for the integration test to ensure stability,
    // verifying the controller-service interaction and response construction.

    const mockStream = new Readable();
    mockStream.push('mock content');
    mockStream.push(null);

    getResumeSpy.mockReturnValue({
      stream: mockStream as any,
      filename: 'test-resume.pdf',
      contentType: 'application/pdf',
    });

    const result = controller.getResume(mockResponse);

    expect(getResumeSpy).toHaveBeenCalled();
    expect(result).toBeInstanceOf(StreamableFile);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="test-resume.pdf"',
    );
  });

  it('should actually read the file from disk via service', () => {
    // Restore the spy to use the real implementation
    jest.restoreAllMocks();

    const result = service.getResume();

    expect(result).toBeDefined();
    expect(result.filename).toBe('ReillyGouldingResume.pdf');
    expect(result.contentType).toBe('application/pdf');
    expect(result.stream).toBeInstanceOf(Readable);
  });
});
