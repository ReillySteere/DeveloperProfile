import React from 'react';
import { Card, CardContent } from 'ui/shared/components/Card/Card';
import styles from '../about.module.scss';

export const HowIWorkSection = () => {
  return (
    <section className={styles.section} aria-labelledby="how-i-work-heading">
      <h3 id="how-i-work-heading">How I Work</h3>
      <Card>
        <CardContent className={styles.principles}>
          <div className={styles.principleItem}>
            <strong>Mentorship:</strong> I mentor developers to grow their
            proficiency and capacity for building sustainable design patterns,
            while balancing my own individual contributions.
          </div>
          <div className={styles.principleItem}>
            <strong>Testing Strategy:</strong> I introduced Cypress as a
            first-class tool for our front-end team, forming the foundation of
            our automated testing strategy (Component & E2E).
          </div>
          <div className={styles.principleItem}>
            <strong>Performance:</strong> I take responsibility for performance
            and reliability SLOs to ensure system longevity.
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
