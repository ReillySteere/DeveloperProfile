import React from 'react';
import styles from './navigation.module.scss';
import Header from './header';
import { Link } from '@tanstack/react-router';

const Navigation: React.FC = () => {
  return (
    <div className={styles.navigation}>
      <Header />
      <Link className={styles.link} to={`/`}>
        About
      </Link>
      <Link className={styles.link} to={`/blog`}>
        Blog
      </Link>
      <Link className={styles.link} to={`/experience`}>
        Experience
      </Link>
      <Link className={styles.link} to={`/goals`}>
        Goals
      </Link>
      <Link className={styles.link} to={`/projects`}>
        Projects
      </Link>
    </div>
  );
};

export default Navigation;
