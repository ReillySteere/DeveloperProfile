import React from 'react';
import { render, screen, fireEvent, waitFor } from 'ui/test-utils';
import { SignInButton } from './components/SignInButton';
import { useAuthStore } from 'ui/shared/stores/authStore';

// Mock fetch
global.fetch = jest.fn();

describe('SignIn Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ isAuthenticated: false, token: null, user: null });
  });

  it('completes the full sign in flow successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'fake-token' }),
    });

    render(<SignInButton />);

    // 1. Verify button exists and click it
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);

    // 2. Fill in credentials
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'demo' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password' },
    });

    // 3. Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    // 4. Verify fetch called
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'demo', password: 'password' }),
      }),
    );

    // 5. Verify modal closes and button changes to Sign Out
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /sign out/i }),
    ).toBeInTheDocument();
  });

  it('displays error message on failed login', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    render(<SignInButton />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'wrong' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Modal should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('handles logout', async () => {
    // Set initial state to authenticated
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'fake',
      user: { username: 'demo' },
    });

    render(<SignInButton />);

    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    expect(signOutButton).toBeInTheDocument();

    fireEvent.click(signOutButton);

    expect(
      screen.getByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument();
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

  it('handles invalid server response (missing token)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}), // No access_token
    });

    render(<SignInButton />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'demo' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(
        screen.getByText('Invalid response from server'),
      ).toBeInTheDocument();
    });
  });

  it('handles non-standard errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce('Network Error'); // Not an Error object

    render(<SignInButton />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'demo' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
  });

  it('handles failed login with default error message', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}), // No message
    });

    render(<SignInButton />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'demo' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
  it('handles null error rejection', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(null);

    render(<SignInButton />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'demo' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
  });
});
