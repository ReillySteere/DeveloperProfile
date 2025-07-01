export interface ExperienceEntry {
  id: string;
  company: string;
  description: string;
  role: string;
  startDate: string;
  endDate: string | null;
  bulletPoints: string[];
  tags: string[];
}
