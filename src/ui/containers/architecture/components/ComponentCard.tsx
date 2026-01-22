import React from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import type { ComponentDocSummary } from 'shared/types';
import styles from './ComponentCard.module.scss';

export interface ComponentCardProps {
  component: ComponentDocSummary;
}

export const ComponentCard = ({ component }: ComponentCardProps) => {
  return (
    <Link
      to="/architecture/components/$slug"
      params={{ slug: component.slug }}
      className={styles.link}
    >
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>{component.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={styles.summary}>{component.summary}</p>
        </CardContent>
      </Card>
    </Link>
  );
};
