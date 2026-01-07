import { createFileRoute } from '@tanstack/react-router';
import ProjectsContainer from 'ui/containers/projects/projects.container';

export const Route = createFileRoute('/projects')({
  component: ProjectsContainer,
});
