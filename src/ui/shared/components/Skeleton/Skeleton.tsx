import React from 'react';
import styles from './Skeleton.module.scss';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: string | number;
}

export const Skeleton = ({
  height,
  'aria-label': ariaLabel = 'Loading',
  ...props
}: SkeletonProps) => {
  return (
    <div
      data-testid="skeleton"
      className={styles.skeleton}
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      style={{ height }}
      {...props}
    />
  );
};
