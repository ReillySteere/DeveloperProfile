import React from 'react';
import { render, screen } from 'ui/test-utils';
import { Card } from './Card';

describe('Card', () => {
  it('renders as a div by default', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.tagName).toBe('DIV');
  });

  it('renders as an article when as="article"', () => {
    render(
      <Card as="article" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId('card').tagName).toBe('ARTICLE');
  });

  it('renders children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Card className="custom" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveClass('custom');
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Card ref={ref} data-testid="card">
        Content
      </Card>,
    );
    expect(ref.current).toBe(screen.getByTestId('card'));
  });
});
