import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'ui/shared/components';
import styles from '../about.module.scss';

export const CoreStrengthsSection = () => {
  return (
    <section
      className={styles.section}
      aria-labelledby="core-strengths-heading"
    >
      <h3 id="core-strengths-heading">Core Strengths</h3>
      <div className={styles.grid}>
        <Card>
          <CardHeader>
            <CardTitle>Technologies</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className={styles.list} aria-label="List of technologies">
              <li>Ruby</li>
              <li>Node.js</li>
              <li>React</li>
              <li>TypeScript</li>
              <li>HTML/CSS</li>
              <li>NestJS</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className={styles.list} aria-label="List of practices">
              <li>Domain-Driven Design</li>
              <li>Event-Driven Architecture</li>
              <li>Automated Testing (Cypress)</li>
              <li>Interaction Design</li>
              <li>Agile Methodologies</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
