import React from 'react';
import { BlogContent } from '../components/BlogContent';

interface BlogPostReaderProps {
  content: string;
}

export const BlogPostReader: React.FC<BlogPostReaderProps> = ({ content }) => {
  return <BlogContent content={content} />;
};
