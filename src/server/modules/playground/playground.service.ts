import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ComponentMetadata, CompositionTemplate } from 'shared/types';

export interface IPlaygroundService {
  getAllComponents(): Promise<ComponentMetadata[]>;
  getComponent(name: string): Promise<ComponentMetadata | undefined>;
  getCompositionTemplates(): Promise<CompositionTemplate[]>;
  getComponentDocs(name: string): Promise<{ content: string } | null>;
}

/**
 * Resolves the base path for playground assets.
 * Uses __dirname detection as primary method (most reliable),
 * with NODE_ENV as fallback.
 */
function resolveBasePath(): string {
  const isCompiled =
    __dirname.includes(path.sep + 'dist' + path.sep) ||
    __dirname.endsWith(path.sep + 'dist');

  const isProduction = process.env.NODE_ENV === 'production';

  /* istanbul ignore if */
  if (isCompiled || isProduction) {
    return path.join(__dirname, '..', '..', '..', '..');
  }
  return process.cwd();
}

@Injectable()
export class PlaygroundService implements IPlaygroundService {
  private readonly basePath = resolveBasePath();
  private readonly metadataPath = path.join(
    this.basePath,
    'public',
    'data',
    'component-metadata.json',
  );
  private readonly templatesPath = path.join(
    this.basePath,
    'public',
    'data',
    'composition-templates.json',
  );
  private cache: ComponentMetadata[] | null = null;
  private templatesCache: CompositionTemplate[] | null = null;

  private async loadMetadata(): Promise<ComponentMetadata[]> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const content = await fs.readFile(this.metadataPath, 'utf-8');
      this.cache = JSON.parse(content) as ComponentMetadata[];
      return this.cache;
    } catch {
      return [];
    }
  }

  private async loadTemplates(): Promise<CompositionTemplate[]> {
    if (this.templatesCache) {
      return this.templatesCache;
    }

    try {
      const content = await fs.readFile(this.templatesPath, 'utf-8');
      this.templatesCache = JSON.parse(content) as CompositionTemplate[];
      return this.templatesCache;
    } catch {
      return [];
    }
  }

  async getAllComponents(): Promise<ComponentMetadata[]> {
    return this.loadMetadata();
  }

  async getComponent(name: string): Promise<ComponentMetadata | undefined> {
    const components = await this.loadMetadata();
    return components.find((c) => c.name.toLowerCase() === name.toLowerCase());
  }

  async getCompositionTemplates(): Promise<CompositionTemplate[]> {
    return this.loadTemplates();
  }

  async getComponentDocs(name: string): Promise<{ content: string } | null> {
    const component = await this.getComponent(name);
    if (!component?.mdxPath) return null;

    try {
      const fullPath = path.join(this.basePath, 'src', component.mdxPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return { content };
    } catch {
      return null;
    }
  }
}
