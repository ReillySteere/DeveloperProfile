import { createFileRoute } from '@tanstack/react-router';
import PlaygroundContainer from 'ui/containers/playground/playground.container';

export const Route = createFileRoute('/playground/')({
  component: PlaygroundContainer,
});
