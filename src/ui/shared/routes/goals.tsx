import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Frame } from 'ui/shared/components';
export const Route = createFileRoute('/goals')({
  component: Goals,
});

function Goals() {
  return (
    <Frame id="goals">
      <span>Goals Content</span>
    </Frame>
  );
}
