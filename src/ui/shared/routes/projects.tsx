import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Frame from 'ui/shared/components/Frame';
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
