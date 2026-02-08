import { createFileRoute } from '@tanstack/react-router';
import ComponentDetailContainer from 'ui/containers/playground/component-detail.container';

export const Route = createFileRoute('/playground/$componentId')({
  component: ComponentDetailContainer,
});
