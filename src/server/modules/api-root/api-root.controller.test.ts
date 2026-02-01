import { ApiRootController } from './api-root.controller';

describe('ApiRootController', () => {
  let controller: ApiRootController;

  beforeEach(() => {
    controller = new ApiRootController();
  });

  describe('getApiRoot', () => {
    it('should return API discovery information', () => {
      const result = controller.getApiRoot();

      expect(result).toHaveProperty('name', 'Developer Profile API');
      expect(result).toHaveProperty('documentation', '/api/docs');
      expect(result).toHaveProperty('endpoints');
    });

    it('should include version from environment variable when available', () => {
      process.env.npm_package_version = '2.0.0';
      const result = controller.getApiRoot();

      expect(result.version).toBe('2.0.0');
      delete process.env.npm_package_version;
    });

    it('should fallback to default version when environment variable is not set', () => {
      delete process.env.npm_package_version;
      const result = controller.getApiRoot();

      expect(result.version).toBe('1.5.0');
    });

    it('should include all expected endpoints', () => {
      const result = controller.getApiRoot();

      expect(result.endpoints).toEqual({
        about: '/api/about',
        experience: '/api/experience',
        projects: '/api/projects',
        blog: '/api/blog',
        architecture: '/api/architecture',
        auth: '/api/auth',
        health: '/api/health',
        traces: '/api/traces',
      });
    });

    it('should return consistent response structure', () => {
      const result1 = controller.getApiRoot();
      const result2 = controller.getApiRoot();

      expect(result1).toEqual(result2);
    });
  });
});
