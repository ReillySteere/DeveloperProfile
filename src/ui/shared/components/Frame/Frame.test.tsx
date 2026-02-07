import React from 'react';
import { render, screen } from 'ui/test-utils';
import Frame from './Frame';

jest.mock('ui/shared/hooks/useNavStore', () => ({
  useNavStore: () => jest.fn(),
}));

describe('Frame', () => {
  it('renders as a main element', () => {
    render(<Frame id="about">Content</Frame>);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('has id="main-content" for skip link target', () => {
    render(<Frame id="about">Content</Frame>);
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('passes id prop as data-section attribute', () => {
    render(<Frame id="about">Content</Frame>);
    expect(screen.getByRole('main')).toHaveAttribute('data-section', 'about');
  });

  it('renders children', () => {
    render(<Frame id="about">Test Content</Frame>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
