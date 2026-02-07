import { Project } from './projects.types';

export interface CaseStudyPhase {
  name: string;
  description: string;
  duration?: string;
}

export interface CaseStudyMetric {
  label: string;
  before?: string;
  after: string;
  description?: string;
}

export interface CaseStudyDiagram {
  type: 'mermaid' | 'image';
  content: string;
  caption?: string;
}

export interface CodeComparison {
  title: string;
  description?: string;
  language: string;
  before: string;
  after: string;
}

export interface CaseStudy {
  id: string;
  slug: string;
  projectId: string;
  project?: Project;
  problemContext: string;
  challenges: string[];
  approach: string;
  phases: CaseStudyPhase[];
  keyDecisions: string[];
  outcomeSummary: string;
  metrics: CaseStudyMetric[];
  learnings: string[];
  diagrams?: CaseStudyDiagram[];
  codeComparisons?: CodeComparison[];
  published: boolean;
}

export interface CaseStudyListItem {
  id: string;
  slug: string;
  projectId: string;
  projectTitle: string;
  projectRole: string;
  technologies: string[];
  published: boolean;
}
