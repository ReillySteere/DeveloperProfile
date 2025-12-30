import React from 'react';
import styles from './Skeleton.module.scss';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: string | number;
}

export const Skeleton = ({ height, ...props }: SkeletonProps) => {
  return (
    <div
      data-testid="skeleton"
      className={styles.skeleton}
      style={{
        height,
      }}
      {...props}
    />
  );
};
