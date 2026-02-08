import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useComponentDocs(componentName: string | undefined) {
  return useQuery({
    queryKey: ['playground', 'docs', componentName],
    queryFn: async () => {
      const { data } = await axios.get<{ content: string }>(
        `/api/playground/components/${componentName}/docs`,
      );
      return data;
    },
    enabled: !!componentName,
  });
}
