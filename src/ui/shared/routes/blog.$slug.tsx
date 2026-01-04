import { createFileRoute } from '@tanstack/react-router';
import BlogPostContainer from 'ui/blog/blog-post.container';

export const Route = createFileRoute('/blog/$slug')({
  component: BlogPostContainer,
});
