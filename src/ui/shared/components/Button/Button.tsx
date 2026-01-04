import React from 'react';
import styles from './Button.module.scss';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  leftIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', leftIcon, children, disabled, ...props },
    ref,
  ) => {
    const rootClassName = [styles.button, styles[variant], styles.md, className]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={rootClassName}
        disabled={disabled}
        {...props}
      >
        {leftIcon}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
