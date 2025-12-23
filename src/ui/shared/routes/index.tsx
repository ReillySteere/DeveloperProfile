import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Frame from 'ui/shared/components/Frame';

export const Route = createFileRoute('/')({
  component: About,
});

function About() {
  return (
    <Frame id="about">
      <span>About Content</span>
    </Frame>
  );
}
