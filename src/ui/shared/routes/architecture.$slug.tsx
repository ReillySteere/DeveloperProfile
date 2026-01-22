import { createFileRoute } from '@tanstack/react-router';
import AdrDetailContainer from 'ui/containers/architecture/adr-detail.container';

export const Route = createFileRoute('/architecture/$slug')({
  component: AdrDetailContainer,
});
