import React from 'react';
import styles from './Header.module.scss';

const Header: React.FC = () => {
  return (
    <div className={styles.header}>
      <span>Reilly Goulding</span>
    </div>
  );
};

export default Header;
