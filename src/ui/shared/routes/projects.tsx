import { createFileRoute } from '@tanstack/react-router';
import ProjectsContainer from 'ui/projects/projects.container';

export const Route = createFileRoute('/projects')({
  component: ProjectsContainer,
});
