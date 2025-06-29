import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Frame from '../components/layout/frame';

export const Route = createFileRoute('/blog')({
  component: Blog,
});

function Blog() {
  return (
    <Frame>
      <span>Blog Content</span>
    </Frame>
  );
}
