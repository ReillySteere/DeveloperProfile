import { createFileRoute } from '@tanstack/react-router';
import TracesContainer from 'ui/containers/status/traces/traces.container';

/**
 * Traces list index route - displays the traces list at /status/traces
 */
export const Route = createFileRoute('/status/traces/')({
  component: TracesContainer,
});
