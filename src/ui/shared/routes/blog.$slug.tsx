import { createFileRoute } from '@tanstack/react-router';
import BlogPostContainer from 'ui/containers/blog/blog-post.container';

export const Route = createFileRoute('/blog/$slug')({
  component: BlogPostContainer,
});
