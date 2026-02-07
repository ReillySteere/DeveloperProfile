import React from 'react';
import { render, screen } from 'ui/test-utils';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('has role="status"', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-busy="true"', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('has default aria-label of "Loading"', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('accepts custom aria-label', () => {
    render(<Skeleton aria-label="Loading profile" />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Loading profile',
    );
  });

  it('applies height style', () => {
    render(<Skeleton height="100px" />);
    expect(screen.getByRole('status')).toHaveStyle({ height: '100px' });
  });
});
