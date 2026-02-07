import { createFileRoute } from '@tanstack/react-router';
import CaseStudyDetailContainer from 'ui/containers/case-studies/case-study-detail.container';

export const Route = createFileRoute('/case-studies/$slug')({
  component: CaseStudyDetailContainer,
});
