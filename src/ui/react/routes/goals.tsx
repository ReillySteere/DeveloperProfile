import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Frame from '../components/layout/frame';
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
