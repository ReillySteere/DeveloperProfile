import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Frame } from 'ui/shared/components';
import { UpdateBlogPost } from './views/UpdateBlogPost/UpdateBlogPost';
import { useCreateBlogPost } from './hooks/useBlog';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';
import { BlogPost } from 'shared/types';

export default function CreateBlogPostContainer() {
  const navigate = useNavigate();
  const createBlogPost = useCreateBlogPost();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/blog' });
    }
  }, [isAuthenticated, navigate]);

  const handleSave = async (post: Partial<BlogPost>) => {
    try {
      const newPost = await createBlogPost.mutateAsync(post);
      navigate({ to: '/blog/$slug', params: { slug: newPost.slug } });
    } catch (error) {
      console.error('Failed to create blog post:', error);
      // Ideally show a toast or error message
    }
  };

  const handleCancel = () => {
    navigate({ to: '/blog' });
  };

  if (!isAuthenticated) return null;

  return (
    <Frame id="blog">
      <h1>Create New Blog Post</h1>
      <UpdateBlogPost onSave={handleSave} onCancel={handleCancel} />
    </Frame>
  );
}
