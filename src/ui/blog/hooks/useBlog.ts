import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { BlogPost } from 'shared/types';
import { useAuthStore } from 'ui/shared/stores/authStore';

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
  const token = useAuthStore((state) => state.token);

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<BlogPost>;
    }) => {
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.put<BlogPost>(`/api/blog/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
