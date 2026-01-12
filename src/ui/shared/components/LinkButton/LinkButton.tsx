import React from 'react';
import styles from '../Button/Button.module.scss';

export interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant: 'primary' | 'secondary';
  leftIcon?: React.ReactNode;
  disabled?: boolean;
}

export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, variant, leftIcon, children, disabled, ...props }, ref) => {
    const rootClassName = [styles.button, styles[variant], styles.md, className]
      .filter(Boolean)
      .join(' ');

    return (
      <a
        ref={ref}
        className={rootClassName}
        aria-disabled={disabled}
        {...props}
      >
        {leftIcon}
        {children}
      </a>
    );
  },
);

LinkButton.displayName = 'LinkButton';
