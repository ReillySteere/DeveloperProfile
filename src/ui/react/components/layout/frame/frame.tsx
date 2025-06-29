import React from 'react';
import styles from './frame.module.scss';

interface FrameProps {
  children?: React.ReactNode;
}

const Frame: React.FC<FrameProps> = ({ children }) => {
  return <div className={styles.frame}>{children}</div>;
};

export default Frame;
