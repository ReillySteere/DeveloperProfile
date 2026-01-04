import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useNavStore } from 'ui/shared/stores/navStore';
import { SignInModal } from './SignInModal';
import styles from './SignInButton.module.scss';

export const SignInButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isExpanded = useNavStore((s) => s.isExpanded);

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
