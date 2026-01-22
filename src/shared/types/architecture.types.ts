export type AdrStatus = 'Proposed' | 'Accepted' | 'Deprecated' | 'Superseded';

/**
 * ADR list item returned by GET /api/architecture/adrs.
 * Includes searchText for client-side full-text filtering.
 * See ADR-009 for rationale on including search content in list response.
 */
export interface AdrListItem {
  slug: string;
  title: string;
  status: AdrStatus;
  date: string;
  number: number;
  /** Short summary/context from the ADR */
  summary: string;
  /** Stripped plain-text content for client-side search */
  searchText: string;
}

/** Full ADR with raw markdown content */
export interface Adr {
  slug: string;
  title: string;
  status: AdrStatus;
  date: string;
  number: number;
  content: string;
}

export interface ComponentDocSummary {
  slug: string;
  name: string;
  summary: string;
}

export interface ComponentDoc extends ComponentDocSummary {
  content: string;
}

export interface DependencyEdge {
  source: string;
  target: string;
  type?: string;
}

export interface DependencyNode {
  id: string;
  label: string;
  type?: string;
}

/** Individual focused graph for a container or module */
export interface FocusedDependencyGraph {
  name: string;
  label: string;
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

/** Complete dependency graphs data structure */
export interface DependencyGraphsData {
  generatedAt: string;
  ui: {
    containers: FocusedDependencyGraph[];
  };
  server: {
    modules: FocusedDependencyGraph[];
  };
}

/** @deprecated Use FocusedDependencyGraph instead */
export interface DependencyGraph {
  scope: 'full' | 'server' | 'ui' | 'shared';
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  generatedAt: string;
}
