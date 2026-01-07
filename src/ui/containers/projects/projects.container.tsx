import React from 'react';
import { Frame } from 'ui/shared/components';
import ProjectsPage from './components/ProjectsPage';

export default function ProjectsContainer() {
  return (
    <Frame id="projects">
      <ProjectsPage />
    </Frame>
  );
}
