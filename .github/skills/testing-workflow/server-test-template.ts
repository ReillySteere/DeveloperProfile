// @ts-nocheck
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;
  let mockDependency: any;

  beforeEach(() => {
    // Manual Dependency Injection pattern (Faster than Test.createTestingModule)
    mockDependency = {
      someMethod: jest.fn().mockReturnValue('mocked-value'),
    };

    service = new MyService(mockDependency);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call dependency', async () => {
    const result = await service.doSomething();
    expect(mockDependency.someMethod).toHaveBeenCalled();
    expect(result).toBe('mocked-value');
  });
});
