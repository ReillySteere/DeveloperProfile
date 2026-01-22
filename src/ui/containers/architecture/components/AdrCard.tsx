import React from 'react';
import { Link } from '@tanstack/react-router';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from 'ui/shared/components';
import type { AdrListItem } from 'shared/types';
import styles from './AdrCard.module.scss';

export interface AdrCardProps {
  adr: AdrListItem;
}

const statusVariantMap: Record<AdrListItem['status'], string> = {
  Proposed: styles.proposed,
  Accepted: styles.accepted,
  Deprecated: styles.deprecated,
  Superseded: styles.superseded,
};

export const AdrCard = ({ adr }: AdrCardProps) => {
  const statusClass = statusVariantMap[adr.status] || styles.accepted;

  return (
    <Link
      to="/architecture/$slug"
      params={{ slug: adr.slug }}
      className={styles.link}
    >
      <Card className={styles.card}>
        <CardHeader>
          <div className={styles.headerRow}>
            <CardTitle>{adr.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className={styles.summary}>{adr.summary}</p>
        </CardContent>
        <CardFooter>
          <div className={styles.statusChangeWrapper}>
            <span className={`${styles.status} ${statusClass}`}>
              {adr.status}
            </span>
            <time className={styles.date} dateTime={adr.date}>
              {new Date(adr.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};
