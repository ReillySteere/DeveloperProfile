import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Frame } from 'ui/shared/components';

export const Route = createFileRoute('/blog')({
  component: Blog,
});

function Blog() {
  return (
    <Frame id="blog">
      <span>Blog Content</span>
    </Frame>
  );
}
