import * as fs from 'fs/promises';
import { PlaygroundService } from './playground.service';

jest.mock('fs/promises');

const mockFs = fs as jest.Mocked<typeof fs>;

const mockMetadata = [
  {
    name: 'Button',
    description: 'A button component',
    category: 'Inputs',
    props: [],
    examples: [],
    importPath: 'ui/shared/components',
  },
  {
    name: 'Badge',
    description: 'A badge component',
    category: 'Data Display',
    props: [],
    examples: [],
    importPath: 'ui/shared/components',
  },
];

const mockTemplates = [
  {
    id: 'performance-dashboard',
    name: 'Performance Dashboard',
    description: 'Combined view',
    layout: 'grid-2x2',
    slots: [
      {
        id: 'vital-lcp',
        componentName: 'VitalGauge',
        label: 'LCP Gauge',
        props: { name: 'LCP', value: 2200 },
      },
    ],
    codeTemplate: 'import ...',
  },
];

describe('PlaygroundService', () => {
  let service: PlaygroundService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlaygroundService();
  });

  describe('getAllComponents', () => {
    it('should load and return component metadata from JSON file', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));

      const result = await service.getAllComponents();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Button');
      expect(result[1].name).toBe('Badge');
    });

    it('should cache metadata after first load', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));

      await service.getAllComponents();
      await service.getAllComponents();

      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when file is missing', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT'));

      const result = await service.getAllComponents();

      expect(result).toEqual([]);
    });
  });

  describe('getComponent', () => {
    it('should return component by name (case-insensitive)', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));

      const result = await service.getComponent('button');

      expect(result).toBeDefined();
      expect(result!.name).toBe('Button');
    });

    it('should return undefined for unknown component', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));

      const result = await service.getComponent('NonExistent');

      expect(result).toBeUndefined();
    });
  });

  describe('getCompositionTemplates', () => {
    it('should load and return composition templates', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTemplates));

      const result = await service.getCompositionTemplates();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('performance-dashboard');
    });

    it('should cache templates after first load', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTemplates));

      await service.getCompositionTemplates();
      await service.getCompositionTemplates();

      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when templates file is missing', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT'));

      const result = await service.getCompositionTemplates();

      expect(result).toEqual([]);
    });
  });
});
