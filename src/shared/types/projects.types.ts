export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  role: string;
  requirements: string[];
  execution: string;
  technologies: string[];
  link?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
}
