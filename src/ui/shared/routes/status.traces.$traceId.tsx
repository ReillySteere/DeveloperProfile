import { createFileRoute } from '@tanstack/react-router';
import TraceDetailContainer from 'ui/containers/status/traces/trace-detail.container';

export const Route = createFileRoute('/status/traces/$traceId')({
  component: TraceDetailContainer,
});
