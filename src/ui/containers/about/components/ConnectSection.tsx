import React from 'react';
import { LinkButton } from 'ui/shared/components';
import { Mail } from 'lucide-react';
import styles from '../about.module.scss';

export const ConnectSection = () => {
  return (
    <section className={styles.section} aria-labelledby="connect-heading">
      <h3 id="connect-heading">Connect</h3>
      <div className={styles.list}>
        <LinkButton
          variant="secondary"
          href="https://www.linkedin.com/in/reillysteere/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Connect on LinkedIn"
        >
          LinkedIn
        </LinkButton>
        <LinkButton
          variant="secondary"
          leftIcon={<Mail size={16} aria-hidden="true" />}
          href="mailto:reilly.steere@gmail.com"
          aria-label="Send an email"
        >
          Email
        </LinkButton>
      </div>
    </section>
  );
};
