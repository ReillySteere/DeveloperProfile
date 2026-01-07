import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Project } from 'shared/types';

interface UseProjectsResult {
  projects: Project[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

const fetchProjects = (): Promise<Project[]> =>
  axios.get<Project[]>('/api/projects').then((response) => response.data);

export function useProjects(): UseProjectsResult {
  const { data, isLoading, isError, error, refetch } = useQuery<
    Project[],
    Error
  >({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    projects: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
