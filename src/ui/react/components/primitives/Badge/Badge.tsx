import React from 'react';
import styles from './Badge.module.scss';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export const Badge = ({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) => {
  return (
    <span
      className={`${styles.badge} ${styles[variant]} ${className || ''}`}
      {...props}
    >
      {children}
    </span>
  );
};
