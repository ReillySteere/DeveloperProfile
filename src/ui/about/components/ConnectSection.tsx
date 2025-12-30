import React from 'react';
import { Button } from 'ui/shared/components';
import { Mail } from 'lucide-react';
import styles from '../about.module.scss';

export const ConnectSection = () => {
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
          onClick={() =>
            (window.location.href = 'mailto:reilly.steere@gmail.com')
          }
          aria-label="Send an email"
        >
          Email
        </Button>
      </div>
    </section>
  );
};
