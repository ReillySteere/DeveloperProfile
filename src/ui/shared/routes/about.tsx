import { createFileRoute } from '@tanstack/react-router';
import AboutContainer from 'ui/about/about.container';

export const Route = createFileRoute('/about')({
  component: AboutContainer,
});
