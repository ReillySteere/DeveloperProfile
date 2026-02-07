import { createFileRoute } from '@tanstack/react-router';
import CaseStudiesContainer from 'ui/containers/case-studies/case-studies.container';

export const Route = createFileRoute('/case-studies/')({
  component: CaseStudiesContainer,
});
