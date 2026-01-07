import React from 'react';
import { Link } from '@tanstack/react-router';
import styles from '../../blog.module.scss';
import { Card } from 'ui/shared/components/Card/Card';
import { Badge } from 'ui/shared/components/Badge/Badge';
import { BlogPost } from 'shared/types';

interface BlogListProps {
  posts: BlogPost[];
}

export const BlogList: React.FC<BlogListProps> = ({ posts }) => {
  return (
    <div className={styles.blogList}>
      {posts.map((post) => (
        <Link
          key={post.id}
          to="/blog/$slug"
          params={{ slug: post.slug }}
          className={styles.blogLink}
        >
          <Card className={styles.blogCard}>
            <h2 className={styles.title}>{post.title}</h2>
            <div className={styles.meta}>
              <span className={styles.date}>
                {new Date(post.publishedAt).toLocaleDateString()}
              </span>
              <div className={styles.tags}>
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="primary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <p className={styles.description}>{post.metaDescription}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
};
