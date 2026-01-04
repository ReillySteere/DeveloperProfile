import React from 'react';
import { render, screen, fireEvent, waitFor } from 'ui/test-utils';
import { SignInButton } from './SignInButton';

describe('SignIn Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('completes the full sign in flow', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    render(<SignInButton />);

    // 1. Verify button exists and click it
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();

    fireEvent.click(signInButton);

    // 2. Verify modal opens
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('Sign In', { selector: 'h2' })).toBeInTheDocument();

    // 3. Fill in credentials
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');

    // 4. Submit form
    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(submitButton);

    // 5. Verify console log and modal closing
    expect(consoleSpy).toHaveBeenCalledWith(
      'Username: testuser attempted to login with password: password123',
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('closes modal when cancel is clicked', async () => {
    render(<SignInButton />);

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click cancel
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Verify closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes modal when close (X) button is clicked', async () => {
    render(<SignInButton />);

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click close X
    fireEvent.click(screen.getByLabelText(/close modal/i));

    // Verify closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes modal when pressing escape', async () => {
    render(<SignInButton />);

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });

    // Verify closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
