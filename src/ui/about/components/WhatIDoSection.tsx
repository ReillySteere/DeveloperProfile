import React from 'react';
import styles from '../about.module.scss';

export const WhatIDoSection = () => {
  return (
    <section className={styles.section} aria-labelledby="what-i-do-heading">
      <h3 id="what-i-do-heading">What I Do</h3>
      <p>
        I focus on platform engineering and architecture, building scalable
        systems and processes to accelerate product teams. I emphasize a
        pragmatic approach to software development, balancing technical
        excellence with business needs, leveraging "Boring" but well tested
        technical solutions to deliver reliable outcomes on time and with clear
        expectations established on the cost of technical compromise.
      </p>
      <p>
        I am comfortable in both direct delivery and technical leadership roles
        with strong examples of project success in both.
      </p>
    </section>
  );
};
