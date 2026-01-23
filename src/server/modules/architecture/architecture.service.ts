import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  Adr,
  AdrListItem,
  AdrStatus,
  ComponentDoc,
  ComponentDocSummary,
  DependencyGraphsData,
  FocusedDependencyGraph,
} from 'shared/types';

export interface IArchitectureService {
  findAllAdrs(): Promise<AdrListItem[]>;
  findAdrBySlug(slug: string): Promise<Adr | null>;
  findAllComponents(): Promise<ComponentDocSummary[]>;
  findComponentBySlug(slug: string): Promise<ComponentDoc | null>;
  getDependencyGraphs(): Promise<DependencyGraphsData>;
  getDependencyGraphByTarget(
    scope: 'ui' | 'server',
    target: string,
  ): Promise<FocusedDependencyGraph>;
}

/**
 * Resolves the base path for architecture assets.
 * In production (NODE_ENV=production), assets are copied to dist/ via nest-cli.json.
 * In development, assets are read from the project root.
 */
function resolveBasePath(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    // In production, assets are in dist/ (copied by nest build)
    // __dirname is dist/src/server/modules/architecture
    return path.join(__dirname, '..', '..', '..', '..');
  }
  // In development, read from project root
  return process.cwd();
}

@Injectable()
export class ArchitectureService implements IArchitectureService {
  private readonly basePath = resolveBasePath();
  private readonly adrPath = path.join(
    this.basePath,
    'architecture',
    'decisions',
  );
  private readonly componentsPath = path.join(
    this.basePath,
    'architecture',
    'components',
  );
  private readonly graphsPath = path.join(this.basePath, 'public', 'data');

  /**
   * Returns all ADRs with searchText for client-side filtering.
   * See ADR-009 for rationale on including full content in list response.
   */
  async findAllAdrs(): Promise<AdrListItem[]> {
    const files = await fs.readdir(this.adrPath);
    const adrs = await Promise.all(
      files
        .filter((f) => f.endsWith('.md'))
        .map(async (file) => this.parseAdrListItem(file)),
    );
    return adrs.sort((a, b) => a.number - b.number);
  }

  async findAdrBySlug(slug: string): Promise<Adr | null> {
    const files = await fs.readdir(this.adrPath);
    const file = files.find((f) => f.replace('.md', '') === slug);
    if (!file) return null;

    const content = await fs.readFile(path.join(this.adrPath, file), 'utf-8');
    const listItem = await this.parseAdrListItem(file);
    // Return full Adr with raw markdown content (not stripped searchText)
    return {
      slug: listItem.slug,
      title: listItem.title,
      status: listItem.status,
      date: listItem.date,
      number: listItem.number,
      content,
    };
  }

  private async parseAdrListItem(filename: string): Promise<AdrListItem> {
    const content = await fs.readFile(
      path.join(this.adrPath, filename),
      'utf-8',
    );
    const slug = filename.replace('.md', '');

    // Extract ADR number from filename (ADR-001-...)
    const numberMatch = filename.match(/ADR-(\d+)/);
    const number = numberMatch ? parseInt(numberMatch[1], 10) : 0;

    // Extract title from first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : slug;

    // Extract status
    const statusMatch = content.match(/##\s+Status\s*\n+([^\n]+)/i);
    const statusLine = statusMatch ? statusMatch[1] : 'Proposed';
    const status = this.parseStatus(statusLine);

    // Extract date from status line
    const dateMatch = statusLine.match(/(\w{3,9}\s+\d{1,2}\s*[/,]\s*\d{4})/);
    const date = dateMatch ? dateMatch[1] : '';

    // Extract summary from Context section (first paragraph after ## Context)
    const contextMatch = content.match(/##\s+Context\s*\n+([^\n#]+)/i);
    const summary = contextMatch
      ? contextMatch[1].trim().substring(0, 200)
      : 'Architectural decision record';

    // Strip markdown for search text (see ADR-009)
    const searchText = this.stripMarkdown(content);

    return { slug, title, status, date, number, summary, searchText };
  }

  private stripMarkdown(content: string): string {
    return content
      .replace(/```[\s\S]*?```/g, ' ') // Remove code blocks
      .replace(/`[^`]+`/g, ' ') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links → text
      .replace(/[#*_~>-]/g, ' ') // Remove markdown symbols
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toLowerCase();
  }

  private parseStatus(line: string): AdrStatus {
    if (line.toLowerCase().includes('accepted')) return 'Accepted';
    if (line.toLowerCase().includes('deprecated')) return 'Deprecated';
    if (line.toLowerCase().includes('superseded')) return 'Superseded';
    return 'Proposed';
  }

  async findAllComponents(): Promise<ComponentDocSummary[]> {
    const files = await fs.readdir(this.componentsPath);
    const components = await Promise.all(
      files
        .filter((f) => f.endsWith('.md'))
        .map(async (f) => {
          const slug = f.replace('.md', '');
          const content = await fs.readFile(
            path.join(this.componentsPath, f),
            'utf-8',
          );
          // Extract first paragraph as summary
          const summaryMatch = content.match(/^#[^#\n]+\n+([^\n#]+)/);
          const summary = summaryMatch
            ? summaryMatch[1].trim()
            : 'Component documentation';
          return {
            slug,
            name: this.slugToTitle(slug),
            summary,
          };
        }),
    );
    return components;
  }

  async findComponentBySlug(slug: string): Promise<ComponentDoc | null> {
    try {
      const content = await fs.readFile(
        path.join(this.componentsPath, `${slug}.md`),
        'utf-8',
      );
      // Extract first paragraph as summary
      const summaryMatch = content.match(/^#[^#\n]+\n+([^\n#]+)/);
      const summary = summaryMatch
        ? summaryMatch[1].trim()
        : 'Component documentation';
      return {
        slug,
        name: this.slugToTitle(slug),
        summary,
        content,
      };
    } catch {
      return null;
    }
  }

  private slugToTitle(slug: string): string {
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async getDependencyGraphs(): Promise<DependencyGraphsData> {
    const filePath = path.join(this.graphsPath, 'dependency-graphs.json');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as DependencyGraphsData;
    } catch {
      throw new NotFoundException(
        "Dependency graphs not found. Run 'npm run generate:deps' to generate.",
      );
    }
  }

  async getDependencyGraphByTarget(
    scope: 'ui' | 'server',
    target: string,
  ): Promise<FocusedDependencyGraph> {
    const graphs = await this.getDependencyGraphs();
    const collection =
      scope === 'ui' ? graphs.ui.containers : graphs.server.modules;
    const graph = collection.find((g) => g.name === target);

    if (!graph) {
      throw new NotFoundException(
        `Dependency graph for ${scope}/${target} not found.`,
      );
    }

    return graph;
  }
}
