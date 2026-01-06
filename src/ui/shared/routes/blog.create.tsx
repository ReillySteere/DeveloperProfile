import { createFileRoute } from '@tanstack/react-router';
import CreateBlogPostContainer from 'ui/blog/create-blog-post.container';

export const Route = createFileRoute('/blog/create')({
  component: CreateBlogPostContainer,
});
