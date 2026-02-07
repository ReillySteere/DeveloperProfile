import React from 'react';
import { MarkdownContent } from 'ui/shared/components';
import styles from '../blog.module.scss';

interface BlogContentProps {
  content: string;
}

/**
 * Blog-specific markdown content wrapper.
 * Uses the shared MarkdownContent component with blog-specific styling.
 */
export const BlogContent: React.FC<BlogContentProps> = ({ content }) => {
  return <MarkdownContent content={content} className={styles.blogPost} />;
};
