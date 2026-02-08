import * as fs from 'fs/promises';
import { PlaygroundService } from './playground.service';

jest.mock('fs/promises');

const mockFs = fs as jest.Mocked<typeof fs>;

const mockMetadata = [
  {
    name: 'Button',
    description: 'A button component',
    category: 'Inputs',
    renderMode: 'direct',
    props: [],
    examples: [],
    importPath: 'ui/shared/components',
  },
  {
    name: 'Badge',
    description: 'A badge component',
    category: 'Data Display',
    renderMode: 'direct',
    props: [],
    examples: [],
    importPath: 'ui/shared/components',
  },
  {
    name: 'VitalGauge',
    description: 'A gauge component',
    category: 'Data Display',
    renderMode: 'direct',
    mdxPath: 'ui/containers/performance/components/VitalGauge.mdx',
    props: [],
    examples: [],
    importPath: 'ui/containers/performance/components/VitalGauge',
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

      expect(result).toHaveLength(3);
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

  describe('getComponentDocs', () => {
    it('should return MDX content for component with mdxPath', async () => {
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockMetadata))
        .mockResolvedValueOnce('# VitalGauge\n\nDocumentation content');

      const result = await service.getComponentDocs('VitalGauge');

      expect(result).toEqual({
        content: '# VitalGauge\n\nDocumentation content',
      });
    });

    it('should return null for component without mdxPath', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));

      const result = await service.getComponentDocs('Button');

      expect(result).toBeNull();
    });

    it('should return null for unknown component', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));

      const result = await service.getComponentDocs('NonExistent');

      expect(result).toBeNull();
    });

    it('should return null when MDX file read fails', async () => {
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockMetadata))
        .mockRejectedValueOnce(new Error('ENOENT'));

      const result = await service.getComponentDocs('VitalGauge');

      expect(result).toBeNull();
    });
  });
});
