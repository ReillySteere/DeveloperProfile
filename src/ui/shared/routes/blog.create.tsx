import { createFileRoute } from '@tanstack/react-router';
import CreateBlogPostContainer from 'ui/containers/blog/create-blog-post.container';

export const Route = createFileRoute('/blog/create')({
  component: CreateBlogPostContainer,
});
