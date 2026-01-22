import { createFileRoute } from '@tanstack/react-router';
import ArchitectureContainer from 'ui/containers/architecture/architecture.container';

export const Route = createFileRoute('/architecture/')({
  component: ArchitectureContainer,
});
