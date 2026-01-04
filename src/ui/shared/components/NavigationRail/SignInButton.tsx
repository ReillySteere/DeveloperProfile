import React from 'react';
import { LogIn } from 'lucide-react';
import styles from './SignInButton.module.scss';
import { Button } from '../Button/Button';

export const SignInButton: React.FC = () => {
  const handleSignIn = () => {
    // TODO: Implement sign in logic
    console.log('Sign in clicked');
  };

  return (
    <Button
      variant="primary"
      leftIcon={<LogIn size={16} />}
      onClick={handleSignIn}
      aria-label="Sign in"
      className={styles.signInButton}
    >
      Sign In
    </Button>
  );
};
