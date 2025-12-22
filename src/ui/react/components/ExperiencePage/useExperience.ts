import { useQuery } from '@tanstack/react-query';
import { ExperienceEntry } from 'shared/types';
import axios from 'axios';

interface UseExperiencesResult {
  experiences: ExperienceEntry[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

const fetchExperiences = (): Promise<ExperienceEntry[]> =>
  axios
    .get<ExperienceEntry[]>('/api/experience')
    .then((response) => response.data);

export function useExperiences(): UseExperiencesResult {
  const { data, isLoading, isError, error, refetch } = useQuery<
    ExperienceEntry[],
    Error
  >({
    queryKey: ['experiences'],
    queryFn: fetchExperiences,
    select: (data: ExperienceEntry[]) => data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    experiences: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
