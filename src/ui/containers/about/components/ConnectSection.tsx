import React from 'react';
import { Button } from 'ui/shared/components';
import { useNavigate } from '@tanstack/react-router';
import { Mail } from 'lucide-react';
import styles from '../about.module.scss';

export const ConnectSection = () => {
  const navigate = useNavigate();

  return (
    <section className={styles.section} aria-labelledby="connect-heading">
      <h3 id="connect-heading">Connect</h3>
      <div className={styles.list}>
        <Button
          variant="secondary"
          onClick={() =>
            window.open('https://www.linkedin.com/in/reillysteere/', '_blank')
          }
          aria-label="Connect on LinkedIn"
        >
          LinkedIn
        </Button>
        <Button
          variant="secondary"
          leftIcon={<Mail size={16} aria-hidden="true" />}
          // @ts-expect-error - useNavigate isn't intended for mailTo, even if it works, so we'll fix this later
          onClick={() => navigate({ to: 'mailto:reilly.steere@gmail.com' })}
          aria-label="Send an email"
        >
          Email
        </Button>
      </div>
    </section>
  );
};
