import React from 'react';
import { Link } from '@tanstack/react-router';
import { Frame, QueryState, Badge, Button } from 'ui/shared/components';
import { useCaseStudies } from './hooks/useCaseStudies';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';
import { CaseStudy } from 'shared/types';
import styles from './case-studies.module.scss';

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
}

function CaseStudyCard({ caseStudy }: CaseStudyCardProps) {
  return (
    <Link
      to="/case-studies/$slug"
      params={{ slug: caseStudy.slug }}
      className={styles.card}
    >
      <h3 className={styles.cardTitle}>{caseStudy.project?.title}</h3>
      <p className={styles.cardRole}>{caseStudy.project?.role}</p>
      <div className={styles.technologies}>
        {caseStudy.project?.technologies.slice(0, 5).map((tech) => (
          <Badge key={tech} variant="primary">
            {tech}
          </Badge>
        ))}
      </div>
    </Link>
  );
}

interface CaseStudyListProps {
  caseStudies: CaseStudy[];
}

function CaseStudyList({ caseStudies }: CaseStudyListProps) {
  return (
    <div className={styles.list}>
      {caseStudies.map((caseStudy) => (
        <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
      ))}
    </div>
  );
}

export default function CaseStudiesContainer() {
  const { data, isLoading, isError, error, refetch } = useCaseStudies();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Frame id="case-studies">
      <div className={styles.header}>
        <h1 className={styles.title}>Case Studies</h1>
        {isAuthenticated && (
          <Button onClick={() => window.alert('Create form coming soon')}>
            Create Case Study
          </Button>
        )}
      </div>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        data={data}
        refetch={refetch}
        isEmpty={(d) => d.length === 0}
        emptyComponent={
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            No case studies available yet.
          </p>
        }
      >
        {(caseStudies) => <CaseStudyList caseStudies={caseStudies} />}
      </QueryState>
    </Frame>
  );
}
