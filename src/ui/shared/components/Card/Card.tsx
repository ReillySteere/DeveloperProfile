import React from 'react';
import styles from './Card.module.scss';

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={`${styles.card} ${className || ''}`} {...props}>
      {children}
    </div>
  );
});
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
