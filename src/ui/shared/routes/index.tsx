import { createFileRoute } from '@tanstack/react-router';
import AboutContainer from 'ui/containers/about/about.container';

export const Route = createFileRoute('/')({
  component: AboutContainer,
});
