import React from 'react';
import { Outlet, useMatches } from '@tanstack/react-router';
import { Frame } from 'ui/shared/components';
import { QueryState } from 'ui/shared/components/QueryState/QueryState';
import { useBlogPosts } from './hooks/useBlog';
import { BlogList } from './components/BlogList';

export default function BlogContainer() {
  const matches = useMatches();
  const isChildActive = matches.some((m) => m.routeId === '/blog/$slug');
  const { data, isLoading, isError, error, refetch } = useBlogPosts();

  if (isChildActive) {
    return <Outlet />;
  }

  return (
    <Frame id="blog">
      <h1>Blog</h1>
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
