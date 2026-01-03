export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  role: string;
  requirements: string[];
  execution: string[];
  results: string[];
  technologies: string[];
  startDate: string;
  endDate?: string;
}
