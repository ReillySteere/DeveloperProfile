import { createFileRoute } from '@tanstack/react-router';
import Experience from 'ui/experience/experience.container';

export const Route = createFileRoute('/experience')({
  component: Experience,
});
