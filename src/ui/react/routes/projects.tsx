import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Frame from '../components/layout/frame';
export const Route = createFileRoute('/projects')({
  component: Projects,
});

function Projects() {
  return (
    <Frame id="projects">
      <span>Projects Content</span>
    </Frame>
  );
}
