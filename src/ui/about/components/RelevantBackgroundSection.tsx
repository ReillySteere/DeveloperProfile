import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'ui/shared/components/Card/Card';
import styles from '../about.module.scss';

export const RelevantBackgroundSection = () => {
  return (
    <section
      className={styles.section}
      aria-labelledby="relevant-background-heading"
    >
      <h3 id="relevant-background-heading">Relevant Background</h3>
      <Card>
        <CardHeader>
          <CardTitle>Technical Leadership</CardTitle>
        </CardHeader>
        <CardContent className={styles.cardText}>
          <p>
            Owned technical domains (POS Front End / BFF), responsible for
            performance and reliability SLOs, architectural evolution, and
            maintenance.
          </p>
          <p>
            Routinely document new architectural decision records (ADRs) and
            logical components, supported by architectural fitness functions.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Strategy & Planning</CardTitle>
        </CardHeader>
        <CardContent className={styles.cardText}>
          <p>
            Provide high-level technical estimates and alternatives for scoping.
            Create and review proposals for new technologies, patterns, and
            implementations.
          </p>
          <p>
            Actively working to introduce event-driven architecture and
            domain-driven design principles.
          </p>
        </CardContent>
      </Card>
    </section>
  );
};
