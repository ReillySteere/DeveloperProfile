import React from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { useNavStore } from 'ui/shared/hooks/useNavStore';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';
import { useAuth } from '../../hooks/useAuth';
import styles from './SignInButton.module.scss';

export const SignInButton: React.FC = () => {
  const isExpanded = useNavStore((s) => s.isExpanded);
  const openLoginModal = useAuthStore((s) => s.openLoginModal);
  const { isAuthenticated, logout, user } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className={styles.signedInContainer}>
        {isExpanded && (
          <h3 className={styles.welcomeMessage}>Welcome, {user.username}!</h3>
        )}

        <button
          onClick={logout}
          aria-label="Sign out"
          className={styles.signInButton}
        >
          <LogOut size={24} />
          {isExpanded && <span className={styles.label}>Sign Out</span>}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => openLoginModal()}
      aria-label="Sign in"
      className={styles.signInButton}
    >
      <LogIn size={24} />
      {isExpanded && <span className={styles.label}>Sign In</span>}
    </button>
  );
};
