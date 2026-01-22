import { createFileRoute } from '@tanstack/react-router';
import ComponentDetailContainer from 'ui/containers/architecture/component-detail.container';

export const Route = createFileRoute('/architecture/components/$slug')({
  component: ComponentDetailContainer,
});
