import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  publishedAt: string;
  tags: string[];
  markdownContent?: string;
  documentContent?: string; // For future use
}

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
