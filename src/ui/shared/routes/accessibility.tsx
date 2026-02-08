import { createFileRoute } from '@tanstack/react-router';
import AccessibilityContainer from 'ui/containers/accessibility/accessibility.container';

export const Route = createFileRoute('/accessibility')({
  component: AccessibilityContainer,
});
