import React from 'react';
import styles from './Card.module.scss';

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'article';
}

export const Card = React.forwardRef<HTMLElement, CardProps>(
  ({ className, children, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref as React.Ref<HTMLDivElement>}
        className={`${styles.card} ${className || ''}`}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
Card.displayName = 'Card';

export const CardHeader = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={styles.header} {...props}>
    {children}
  </div>
);

export const CardTitle = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={styles.title} {...props}>
    {children}
  </h3>
);

export const CardContent = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.content} ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.footer} ${className || ''}`} {...props}>
    {children}
  </div>
);
