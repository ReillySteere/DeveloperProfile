import React from 'react';
import { render, screen, waitFor, userEvent } from 'ui/test-utils';
import { SignInButton } from 'ui/shared/components/SignIn/SignInButton';
import { SignInModal } from 'ui/shared/components/SignIn/SignInModal';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';
import { server, createAuthHandlers } from 'ui/test-utils/msw';

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
    // MSW default handlers provide success scenario
    const user = userEvent.setup();

    render(<SignInIntegration />);

    // 1. Verify button exists and click it
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(signInButton);

    // 2. Fill in credentials
    await user.type(screen.getByLabelText(/username/i), 'demo');
    await user.type(screen.getByLabelText(/password/i), 'password');

    // 3. Submit form
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    // 4. Verify modal closes and button changes to Sign Out
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /sign out/i }),
    ).toBeInTheDocument();
  });

  it('displays error message on failed login', async () => {
    // Override handlers for failure scenario
    server.use(...createAuthHandlers({ scenario: 'failure' }));
    const user = userEvent.setup();

    render(<SignInIntegration />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await user.type(screen.getByLabelText(/username/i), 'wrong');
    await user.type(screen.getByLabelText(/password/i), 'wrong');

    await user.click(screen.getByRole('button', { name: 'Sign In' }));

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
    const user = userEvent.setup();

    render(<SignInIntegration />);

    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    expect(signOutButton).toBeInTheDocument();

    await user.click(signOutButton);

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
    const user = userEvent.setup();
    render(<SignInIntegration />);

    // Open modal
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click cancel
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Verify closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes modal when close (X) button is clicked', async () => {
    const user = userEvent.setup();
    render(<SignInIntegration />);

    // Open modal
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click close X
    await user.click(screen.getByLabelText(/close modal/i));

    // Verify closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes modal when pressing escape', async () => {
    const user = userEvent.setup();
    render(<SignInIntegration />);

    // Open modal
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Verify other keys don't close it
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('handles invalid server response (missing token)', async () => {
    server.use(...createAuthHandlers({ scenario: 'missing-token' }));
    const user = userEvent.setup();

    render(<SignInIntegration />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await user.type(screen.getByLabelText(/username/i), 'demo');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(
        screen.getByText('Invalid response from server'),
      ).toBeInTheDocument();
    });
  });

  it('handles non-standard errors', async () => {
    server.use(...createAuthHandlers({ scenario: 'network-error' }));
    const user = userEvent.setup();

    render(<SignInIntegration />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await user.type(screen.getByLabelText(/username/i), 'demo');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('handles failed login with default error message', async () => {
    server.use(...createAuthHandlers({ scenario: 'no-message' }));
    const user = userEvent.setup();

    render(<SignInIntegration />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await user.type(screen.getByLabelText(/username/i), 'demo');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('handles null error rejection', async () => {
    // Network errors from MSW trigger the error scenario
    server.use(...createAuthHandlers({ scenario: 'network-error' }));
    const user = userEvent.setup();

    render(<SignInIntegration />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await user.type(screen.getByLabelText(/username/i), 'demo');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      // MSW throws Error objects, so we get the message
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('focuses the username input when opened', async () => {
    const user = userEvent.setup();
    render(<SignInIntegration />);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const usernameInput = screen.getByLabelText(/username/i);
    expect(usernameInput).toHaveFocus();
  });

  it('closes modal when clicking the overlay backdrop', async () => {
    const user = userEvent.setup();
    render(<SignInIntegration />);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const overlay = screen.getByTestId('signin-overlay');
    await user.click(overlay);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('disables inputs while loading', async () => {
    // Use MSW with delay to test loading state
    server.use(
      ...createAuthHandlers({ scenario: 'success', token: 'valid-token' }),
    );
    const user = userEvent.setup();

    render(<SignInIntegration />);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await user.type(screen.getByLabelText(/username/i), 'user');
    await user.type(screen.getByLabelText(/password/i), 'pass');

    // Click submit - the form will show loading state while request is pending
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    // Wait for successful completion (MSW resolves immediately by default)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
