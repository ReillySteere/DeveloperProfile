import { createFileRoute } from '@tanstack/react-router';
import DependenciesContainer from 'ui/containers/architecture/dependencies.container';

export const Route = createFileRoute('/architecture/dependencies')({
  component: DependenciesContainer,
});
