import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { BlogPost } from 'shared/types';

const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  const { data } = await axios.get<BlogPost[]>('/api/blog');
  return data;
};

const fetchBlogPost = async (slug: string): Promise<BlogPost> => {
  const { data } = await axios.get<BlogPost>(`/api/blog/${slug}`);
  return data;
};

export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: fetchBlogPosts,
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => {
      return fetchBlogPost(slug);
    },
    enabled: !!slug,
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<BlogPost>;
    }) => {
      const response = await axios.put<BlogPost>(`/api/blog/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['blog-post', data.slug],
      });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<BlogPost>) => {
      const response = await axios.post<BlogPost>('/api/blog', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}
