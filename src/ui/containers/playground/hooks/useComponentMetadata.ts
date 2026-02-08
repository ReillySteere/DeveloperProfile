import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ComponentMetadata } from 'shared/types';

const fetchComponents = async (): Promise<ComponentMetadata[]> => {
  const { data } = await axios.get<ComponentMetadata[]>(
    '/api/playground/components',
  );
  return data;
};

const fetchComponent = async (name: string): Promise<ComponentMetadata> => {
  const { data } = await axios.get<ComponentMetadata>(
    `/api/playground/components/${name}`,
  );
  return data;
};

export function useComponentMetadata() {
  return useQuery({
    queryKey: ['playground', 'components'],
    queryFn: fetchComponents,
    staleTime: Infinity,
  });
}

export function useComponentDetail(name: string) {
  return useQuery({
    queryKey: ['playground', 'components', name],
    queryFn: () => fetchComponent(name),
    enabled: !!name,
    staleTime: Infinity,
  });
}
