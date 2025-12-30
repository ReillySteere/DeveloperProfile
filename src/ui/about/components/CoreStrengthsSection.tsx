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
              <li>AngularJS</li>
              <li>Cypress</li>
              <li>HTML/CSS</li>
              <li>NestJS</li>
              <li>Node.js</li>
              <li>Grafana</li>
              <li>Prometheus</li>
              <li>Rails</li>
              <li>React</li>
              <li>Sentry</li>
              <li>Splunk</li>
              <li>TypeScript</li>
              <li>Webpack</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className={styles.list} aria-label="List of practices">
              <li>Agile Methodologies</li>
              <li>Architectural Decision Records / Enforcement</li>
              <li>Automated End to End Testing</li>
              <li>Backend For Frontend Systems</li>
              <li>Domain Driven Design</li>
              <li>Event Driven Architecture</li>
              <li>Micro Front End Architecture</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
