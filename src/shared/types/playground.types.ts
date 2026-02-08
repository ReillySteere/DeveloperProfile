export type PropControlType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'color'
  | 'node'
  | 'function'
  | 'json';

export interface PropOption {
  label: string;
  value: string;
}

export interface PropDefinition {
  name: string;
  type: string;
  controlType: PropControlType;
  required: boolean;
  defaultValue?: string;
  description?: string;
  options?: PropOption[];
}

export type ComponentCategory =
  | 'Data Display'
  | 'Inputs'
  | 'Layout'
  | 'Feedback'
  | 'Navigation';

export interface ComponentExample {
  name: string;
  props: Record<string, unknown>;
}

export interface ComponentMetadata {
  name: string;
  description: string;
  category: ComponentCategory;
  props: PropDefinition[];
  examples: ComponentExample[];
  importPath: string;
  renderMode?: 'iframe' | 'direct';
  sampleData?: Record<string, unknown>;
  selfContained?: boolean;
}

export type ViewportSize = 'mobile' | 'tablet' | 'desktop' | 'full';

export interface ViewportDimensions {
  width: number;
  height: number;
  label: string;
}

export const VIEWPORT_DIMENSIONS: Record<ViewportSize, ViewportDimensions> = {
  mobile: { width: 375, height: 667, label: 'Mobile' },
  tablet: { width: 768, height: 1024, label: 'Tablet' },
  desktop: { width: 1280, height: 800, label: 'Desktop' },
  full: { width: 0, height: 0, label: 'Full' },
};

export interface PlaygroundState {
  component: ComponentMetadata | null;
  props: Record<string, unknown>;
  viewport: ViewportSize;
  theme: 'light' | 'dark';
  showGrid: boolean;
}

export interface GeneratedCode {
  jsx: string;
  fullExample: string;
}

export type TemplateLayout =
  | 'grid-2x1'
  | 'grid-1x2'
  | 'grid-2x2'
  | 'stack'
  | 'full';

export interface CompositionSlot {
  id: string;
  componentName: string;
  label: string;
  props: Record<string, unknown>;
  area?: string;
}

export interface CompositionTemplate {
  id: string;
  name: string;
  description: string;
  layout: TemplateLayout;
  slots: CompositionSlot[];
  codeTemplate: string;
}
