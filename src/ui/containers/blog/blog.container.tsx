import React from 'react';
import { Link } from '@tanstack/react-router';
import { Frame } from 'ui/shared/components';
import { Button } from 'ui/shared/components/Button/Button';
import { QueryState } from 'ui/shared/components/QueryState/QueryState';
import { useBlogPosts } from './hooks/useBlog';
import { BlogList } from './views/BlogList';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';
import styles from './blog.module.scss';

export default function BlogContainer() {
  const { data, isLoading, isError, error, refetch } = useBlogPosts();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Frame id="blog">
      {isAuthenticated && (
        <div className={styles.createButtonContainer}>
          <Link to="/blog/create">
            <Button>Create New Post</Button>
          </Link>
        </div>
      )}
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        data={data}
        refetch={refetch}
      >
        {(posts) => <BlogList posts={posts} />}
      </QueryState>
    </Frame>
  );
}
