import React from 'react';
import styles from './Badge.module.scss';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: 'primary';
}

export const Badge = ({ variant, children, ...props }: BadgeProps) => {
  return (
    <span className={`${styles.badge} ${styles[variant]}`} {...props}>
      {children}
    </span>
  );
};
