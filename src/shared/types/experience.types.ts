export interface ExperienceEntry {
  id: string;
  description: string;
  title: string;
  startDate: string;
  endDate: string | null;
  bulletPoints: string[];
  tags: string[];
}
