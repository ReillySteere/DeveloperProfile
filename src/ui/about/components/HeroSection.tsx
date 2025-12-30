import React from 'react';
import { MapPin } from 'lucide-react';
import styles from '../about.module.scss';

export const HeroSection = () => {
  return (
    <section className={styles.hero} aria-label="Introduction">
      <h1>Reilly Goulding</h1>
      <h2>Staff Full Stack Developer</h2>
      <div className={styles.location}>
        <MapPin size={16} aria-hidden="true" />
        <span>Calgary, AB</span>
      </div>
    </section>
  );
};
