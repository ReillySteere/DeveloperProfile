import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { CaseStudy } from 'shared/types';

const fetchCaseStudies = async (): Promise<CaseStudy[]> => {
  const { data } = await axios.get<CaseStudy[]>('/api/case-studies');
  return data;
};

const fetchCaseStudy = async (slug: string): Promise<CaseStudy> => {
  const { data } = await axios.get<CaseStudy>(`/api/case-studies/${slug}`);
  return data;
};

export function useCaseStudies() {
  return useQuery({
    queryKey: ['case-studies'],
    queryFn: fetchCaseStudies,
  });
}

export function useCaseStudy(slug: string) {
  return useQuery({
    queryKey: ['case-study', slug],
    queryFn: () => fetchCaseStudy(slug),
    enabled: !!slug,
  });
}

export function useCreateCaseStudy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CaseStudy>) => {
      const response = await axios.post<CaseStudy>('/api/case-studies', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-studies'] });
    },
  });
}

export function useUpdateCaseStudy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CaseStudy>;
    }) => {
      const response = await axios.put<CaseStudy>(
        `/api/case-studies/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['case-study', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['case-studies'] });
    },
  });
}

export function useDeleteCaseStudy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/case-studies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-studies'] });
    },
  });
}
