import { createFileRoute } from '@tanstack/react-router';
import BlogContainer from 'ui/blog/blog.container';

export const Route = createFileRoute('/blog')({
  component: BlogContainer,
});
