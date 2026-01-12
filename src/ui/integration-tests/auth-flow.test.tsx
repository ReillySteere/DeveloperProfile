import React from 'react';
import { render, screen, fireEvent, waitFor } from 'ui/test-utils';
import { SignInButton } from 'ui/shared/components/SignIn/SignInButton';
import { SignInModal } from 'ui/shared/components/SignIn/SignInModal';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';

// Mock fetch
global.fetch = jest.fn();

const SignInIntegration = () => (
  <>
    <SignInButton />
    <SignInModal />
  </>
);

describe('SignIn Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: false,
      token: null,
      user: null,
      isLoginModalOpen: false,
      authError: null,
    });
  });

  it('completes the full sign in flow successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'fake-token' }),
    });

    render(<SignInIntegration />);

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

    render(<SignInIntegration />);

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
      isLoginModalOpen: false,
    });

    render(<SignInIntegration />);

    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    expect(signOutButton).toBeInTheDocument();

    fireEvent.click(signOutButton);

    expect(
      screen.getByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it('displays session expired message when triggered globally', async () => {
    useAuthStore.setState({
      isLoginModalOpen: true,
      authError: 'Your session has expired.',
    });

    render(<SignInIntegration />);

    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('Your session has expired.')).toBeInTheDocument();
  });

  it('closes modal when cancel is clicked', async () => {
    render(<SignInIntegration />);

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
    render(<SignInIntegration />);

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
    render(<SignInIntegration />);

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Verify other keys don't close it
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('handles invalid server response (missing token)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}), // No access_token
    });

    render(<SignInIntegration />);

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

    render(<SignInIntegration />);

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

    render(<SignInIntegration />);

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

    render(<SignInIntegration />);

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

  it('focuses the username input when opened', () => {
    render(<SignInIntegration />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const usernameInput = screen.getByLabelText(/username/i);
    expect(usernameInput).toHaveFocus();
  });

  it('closes modal when clicking the overlay backdrop', async () => {
    render(<SignInIntegration />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const overlay = screen.getByTestId('signin-overlay');
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('disables inputs while loading', async () => {
    let resolveRef: (val: any) => void;
    (global.fetch as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveRef = resolve;
      }),
    );

    render(<SignInIntegration />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'user' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'pass' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByLabelText(/username/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

    // Resolve successfully
    resolveRef!({
      ok: true,
      json: async () => ({ access_token: 'valid-token' }),
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
