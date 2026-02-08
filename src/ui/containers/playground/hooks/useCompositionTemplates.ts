import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { CompositionTemplate } from 'shared/types';

const fetchTemplates = async (): Promise<CompositionTemplate[]> => {
  const { data } = await axios.get<CompositionTemplate[]>(
    '/api/playground/compositions',
  );
  return data;
};

export function useCompositionTemplates() {
  return useQuery({
    queryKey: ['playground', 'compositions'],
    queryFn: fetchTemplates,
    staleTime: Infinity,
  });
}
