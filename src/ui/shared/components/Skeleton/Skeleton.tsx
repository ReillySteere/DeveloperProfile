import React from 'react';
import styles from './Skeleton.module.scss';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export const Skeleton = ({
  className,
  width,
  height,
  circle,
  style,
  ...props
}: SkeletonProps) => {
  return (
    <div
      className={`${styles.skeleton} ${className || ''}`}
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : undefined,
        ...style,
      }}
      {...props}
    />
  );
};
