import { createFileRoute } from '@tanstack/react-router';
import Status from 'ui/containers/status/status.container';

export const Route = createFileRoute('/status/')({
  component: Status,
});
