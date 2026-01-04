import React from 'react';
import { render, screen, fireEvent } from 'ui/test-utils';
import { SignInButton } from './SignInButton';

describe('SignInButton', () => {
  it('renders correctly', () => {
    render(<SignInButton />);
    const button = screen.getByRole('button', { name: /sign in/i });
    expect(button).toBeInTheDocument();
  });

  it('handles click event', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    render(<SignInButton />);

    const button = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(button);

    expect(consoleSpy).toHaveBeenCalledWith('Sign in clicked');
    consoleSpy.mockRestore();
  });
});
