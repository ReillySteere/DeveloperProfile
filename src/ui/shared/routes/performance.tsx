import { createFileRoute } from '@tanstack/react-router';
import PerformanceContainer from 'ui/containers/performance/performance.container';

export const Route = createFileRoute('/performance')({
  component: PerformanceContainer,
});
