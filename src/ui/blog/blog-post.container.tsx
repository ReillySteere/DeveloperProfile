import React from 'react';
import { useParams } from '@tanstack/react-router';
import { Frame } from 'ui/shared/components';
import { QueryState } from 'ui/shared/components/QueryState/QueryState';
import { useBlogPost } from './hooks/useBlog';
import { BlogPost } from './components/BlogPost';
import { Badge } from 'ui/shared/components/Badge/Badge';
import styles from './blog.module.scss';

export default function BlogPostContainer() {
  const { slug } = useParams({ from: '/blog/$slug' });
  const { data, isLoading, isError, error, refetch } = useBlogPost(slug);

  return (
    <Frame id="blog-post">
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        data={data}
        refetch={refetch}
        isEmpty={() => false} // Single item, if data exists it's not empty
      >
        {(post) => (
          <article>
            <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                {post.title}
              </h1>
              <div className={styles.meta} style={{ justifyContent: 'center' }}>
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
            </header>
            <BlogPost content={post.content} />
          </article>
        )}
      </QueryState>
    </Frame>
  );
}
