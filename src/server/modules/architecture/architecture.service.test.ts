import * as fs from 'fs/promises';
import { ArchitectureService } from './architecture.service';

// Mock fs/promises
jest.mock('fs/promises');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('ArchitectureService', () => {
  let service: ArchitectureService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ArchitectureService();
  });

  describe('findAllAdrs', () => {
    it('should return sorted ADR list items with searchText and summary', async () => {
      mockFs.readdir.mockResolvedValue([
        'ADR-002-second.md',
        'ADR-001-first.md',
        'not-an-adr.txt',
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      mockFs.readFile.mockImplementation(async (filePath: unknown) => {
        const pathStr = filePath as string;
        if (pathStr.includes('ADR-001')) {
          return '# ADR-001: First Decision\n\n## Status\n\nAccepted - January 10, 2026\n\n## Context\n\nSome context here.';
        }
        if (pathStr.includes('ADR-002')) {
          return '# ADR-002: Second Decision\n\n## Status\n\nProposed\n\n## Context\n\nMore context.';
        }
        return '';
      });

      const result = await service.findAllAdrs();

      expect(result).toHaveLength(2);
      expect(result[0].number).toBe(1);
      expect(result[0].slug).toBe('ADR-001-first');
      expect(result[0].title).toBe('ADR-001: First Decision');
      expect(result[0].status).toBe('Accepted');
      expect(result[0].summary).toBe('Some context here.');
      expect(result[0].searchText).toContain('first decision');
      expect(result[1].number).toBe(2);
      expect(result[1].status).toBe('Proposed');
      expect(result[1].summary).toBe('More context.');
    });

    it('should extract date from status line', async () => {
      mockFs.readdir.mockResolvedValue([
        'ADR-001-test.md',
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      mockFs.readFile.mockResolvedValue(
        '# ADR-001: Test\n\n## Status\n\nAccepted - January 15, 2026\n\nContent',
      );

      const result = await service.findAllAdrs();

      expect(result[0].date).toBe('January 15, 2026');
    });

    it('should handle deprecated status', async () => {
      mockFs.readdir.mockResolvedValue([
        'ADR-001-test.md',
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      mockFs.readFile.mockResolvedValue(
        '# ADR-001: Test\n\n## Status\n\nDeprecated\n\n## Context\n\nSome context.',
      );

      const result = await service.findAllAdrs();

      expect(result[0].status).toBe('Deprecated');
    });

    it('should handle superseded status', async () => {
      mockFs.readdir.mockResolvedValue([
        'ADR-001-test.md',
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      mockFs.readFile.mockResolvedValue(
        '# ADR-001: Test\n\n## Status\n\nSuperseded by ADR-002\n\n## Context\n\nSome context.',
      );

      const result = await service.findAllAdrs();

      expect(result[0].status).toBe('Superseded');
    });

    it('should use defaults when ADR lacks optional fields', async () => {
      mockFs.readdir.mockResolvedValue([
        'not-numbered.md',
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      // Minimal ADR without number, status section, title heading, or context
      mockFs.readFile.mockResolvedValue(
        'Some plain text content without headings',
      );

      const result = await service.findAllAdrs();

      expect(result[0].number).toBe(0);
      expect(result[0].title).toBe('not-numbered');
      expect(result[0].status).toBe('Proposed');
      expect(result[0].date).toBe('');
      expect(result[0].summary).toBe('Architectural decision record');
    });
  });

  describe('findAdrBySlug', () => {
    it('should return full ADR with content', async () => {
      const adrContent =
        '# ADR-001: Test ADR\n\n## Status\n\nAccepted\n\n## Context\n\nFull content here.';

      mockFs.readdir.mockResolvedValue([
        'ADR-001-test-adr.md',
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      mockFs.readFile.mockResolvedValue(adrContent);

      const result = await service.findAdrBySlug('ADR-001-test-adr');

      expect(result).not.toBeNull();
      expect(result!.slug).toBe('ADR-001-test-adr');
      expect(result!.content).toBe(adrContent);
    });

    it('should return null for non-existent ADR', async () => {
      mockFs.readdir.mockResolvedValue([
        'ADR-001-exists.md',
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      const result = await service.findAdrBySlug('ADR-999-not-found');

      expect(result).toBeNull();
    });
  });

  describe('findAllComponents', () => {
    it('should return component doc summaries with name and summary', async () => {
      mockFs.readdir.mockResolvedValue([
        'blog.md',
        'auth.md',
        'not-markdown.txt',
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      mockFs.readFile.mockImplementation(async (filePath: unknown) => {
        const pathStr = filePath as string;
        if (pathStr.includes('blog')) {
          return '# Blog Component\n\nHandles blog functionality.';
        }
        if (pathStr.includes('auth')) {
          return '# Auth Component\n\nManages authentication.';
        }
        return '';
      });

      const result = await service.findAllComponents();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        slug: 'blog',
        name: 'Blog',
        summary: 'Handles blog functionality.',
      });
      expect(result).toContainEqual({
        slug: 'auth',
        name: 'Auth',
        summary: 'Manages authentication.',
      });
    });

    it('should convert multi-word slugs to names', async () => {
      mockFs.readdir.mockResolvedValue(['shared-ui.md'] as unknown as Awaited<
        ReturnType<typeof fs.readdir>
      >);

      mockFs.readFile.mockResolvedValue('# Shared UI\n\nShared UI components.');

      const result = await service.findAllComponents();

      expect(result[0].name).toBe('Shared Ui');
    });
  });

  describe('findComponentBySlug', () => {
    it('should return component doc with content, name, and summary', async () => {
      const content = '# Blog Component\n\nDocumentation here.';
      mockFs.readFile.mockResolvedValue(content);

      const result = await service.findComponentBySlug('blog');

      expect(result).not.toBeNull();
      expect(result!.slug).toBe('blog');
      expect(result!.name).toBe('Blog');
      expect(result!.summary).toBe('Documentation here.');
      expect(result!.content).toBe(content);
    });

    it('should return null for non-existent component', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT'));

      const result = await service.findComponentBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getDependencyGraphs', () => {
    it('should return all dependency graphs', async () => {
      const graphsData = {
        generatedAt: '2026-01-18T00:00:00Z',
        ui: {
          containers: [
            {
              name: 'blog',
              label: 'Blog',
              nodes: [{ id: 'blog', label: 'Blog' }],
              edges: [],
            },
          ],
        },
        server: {
          modules: [
            {
              name: 'auth',
              label: 'Auth',
              nodes: [{ id: 'auth', label: 'Auth' }],
              edges: [],
            },
          ],
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(graphsData));

      const result = await service.getDependencyGraphs();

      expect(result.generatedAt).toBe('2026-01-18T00:00:00Z');
      expect(result.ui.containers).toHaveLength(1);
      expect(result.server.modules).toHaveLength(1);
    });

    it('should throw NotFoundException when graphs file not found', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT'));

      await expect(service.getDependencyGraphs()).rejects.toThrow(
        'Dependency graphs not found',
      );
    });
  });

  describe('getDependencyGraphByTarget', () => {
    it('should return specific UI container graph', async () => {
      const graphsData = {
        generatedAt: '2026-01-18T00:00:00Z',
        ui: {
          containers: [
            {
              name: 'blog',
              label: 'Blog',
              nodes: [{ id: 'blog', label: 'Blog' }],
              edges: [],
            },
          ],
        },
        server: {
          modules: [],
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(graphsData));

      const result = await service.getDependencyGraphByTarget('ui', 'blog');

      expect(result.name).toBe('blog');
      expect(result.label).toBe('Blog');
      expect(result.nodes).toHaveLength(1);
    });

    it('should return specific server module graph', async () => {
      const graphsData = {
        generatedAt: '2026-01-18T00:00:00Z',
        ui: {
          containers: [],
        },
        server: {
          modules: [
            {
              name: 'auth',
              label: 'Auth',
              nodes: [{ id: 'auth', label: 'Auth' }],
              edges: [{ source: 'auth', target: 'shared' }],
            },
          ],
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(graphsData));

      const result = await service.getDependencyGraphByTarget('server', 'auth');

      expect(result.name).toBe('auth');
      expect(result.label).toBe('Auth');
      expect(result.edges).toHaveLength(1);
    });

    it('should throw NotFoundException for unknown target', async () => {
      const graphsData = {
        generatedAt: '2026-01-18T00:00:00Z',
        ui: { containers: [] },
        server: { modules: [] },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(graphsData));

      await expect(
        service.getDependencyGraphByTarget('ui', 'nonexistent'),
      ).rejects.toThrow('Dependency graph for ui/nonexistent not found');
    });
  });

  describe('stripMarkdown', () => {
    it('should remove code blocks from searchText', async () => {
      mockFs.readdir.mockResolvedValue([
        'ADR-001-test.md',
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      mockFs.readFile.mockResolvedValue(
        '# ADR-001: Test\n\n## Status\n\nAccepted\n\n```typescript\nconst x = 1;\n```\n\nSome text.',
      );

      const result = await service.findAllAdrs();

      expect(result[0].searchText).not.toContain('const x');
      expect(result[0].searchText).toContain('some text');
    });

    it('should convert links to text in searchText', async () => {
      mockFs.readdir.mockResolvedValue([
        'ADR-001-test.md',
      ] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      mockFs.readFile.mockResolvedValue(
        '# ADR-001: Test\n\n## Status\n\nAccepted\n\nSee [documentation](http://example.com) for details.',
      );

      const result = await service.findAllAdrs();

      expect(result[0].searchText).toContain('documentation');
      expect(result[0].searchText).not.toContain('http://example.com');
    });
  });
});
