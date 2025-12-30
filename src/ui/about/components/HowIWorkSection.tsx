import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'ui/shared/components';
import styles from '../about.module.scss';

export const HowIWorkSection = () => {
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
            Provided technical ownership of front-end architecture and
            implementation strategy on an international e-commerce platform with
            thousands of daily users and high requirements for performance and
            reliability.
          </p>
          <p>
            Routinely document new architectural decision records (ADRs) and
            logical components, supported by architectural fitness functions.
          </p>
          <p>
            Provide mentorship to junior and mid-level developers to grow their
            skills and capacity for building sustainable software, with a heavy
            emphasis on identifying and applying design patterns.
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
            Collaborate with other stakeholders as a technical lead to ensure
            effective delivery of large-scale and technically complex new
            product offerings.
          </p>
          <p>
            Strong believer that technical health and business needs are not
            mutually exclusive, and that improvements of technical
            infrastructure must be made and articulated in terms of business
            benefit.
          </p>
          <p>
            Operated as technical lead and project manager on multiple highly
            critical system refactors, migrating legacy systems to modern
            frameworks with minimal disruption to end users. (AngularJS to
            React, Rails to NodeJS/NestJS)
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent className={styles.cardText}>
          <p>
            Strong proponent of domain driven design (DDD) and event-driven
            architecture (EDA) to create scalable and maintainable systems that
            can evolve over time to address emergent business needs.
          </p>
          <p>
            Strong individual contributor with a focus on delivering
            high-quality, testable code with robust integration and end to end
            testing tooling.
          </p>
          <p>
            Very comfortable with continuous delivery environments, with a long
            history of working with feature flags and observability tools
            (Splunk / Grafana / Sentry / Prometheus) to ensure that work can be
            completed in an iterative manner with only the intended impact on
            the end user.
          </p>
        </CardContent>
      </Card>
    </section>
  );
};
