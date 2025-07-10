import { useQuery } from '@tanstack/react-query';
import { ExperienceEntry } from 'shared/types';
import axios from 'axios';

interface UseExperiencesResult {
  experiences: ExperienceEntry[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const fetchExperiences = (): Promise<ExperienceEntry[]> =>
  axios
    .get<ExperienceEntry[]>('/api/experience')
    .then((response) => response.data);

export function useExperiences(): UseExperiencesResult {
  const { data, isLoading, isError } = useQuery<ExperienceEntry[], Error>({
    queryKey: ['experiences'],
    queryFn: fetchExperiences,
    select: (data: ExperienceEntry[]) => data,
    staleTime: 1000,
  });

  return {
    experiences: data,
    isLoading,
    isError,
  };
}
