import React from 'react';
import styles from './Skeleton.module.scss';

interface SkeletonProps extends React.HTMLAttributes<HTMLOutputElement> {
  height?: string | number;
}

export const Skeleton = ({
  height,
  'aria-label': ariaLabel = 'Loading',
  ...props
}: SkeletonProps) => {
  return (
    <output
      data-testid="skeleton"
      className={styles.skeleton}
      aria-busy="true"
      aria-label={ariaLabel}
      style={{ height }}
      {...props}
    />
  );
};
