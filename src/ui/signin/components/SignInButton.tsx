import React, { useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { useNavStore } from 'ui/shared/stores/navStore';
import { useAuth } from '../hooks/useAuth';
import { SignInModal } from './SignInModal';
import styles from './SignInButton.module.scss';

export const SignInButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isExpanded = useNavStore((s) => s.isExpanded);
  const { isAuthenticated, logout, user } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className={styles.signedInContainer}>
        <h3 className={styles.welcomeMessage}>Welcome, {user.username}!</h3>
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
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        aria-label="Sign in"
        className={styles.signInButton}
      >
        <LogIn size={24} />
        {isExpanded && <span className={styles.label}>Sign In</span>}
      </button>

      <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
