import React, { useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import {
  Frame,
  QueryState,
  Badge,
  Button,
  MarkdownContent,
} from 'ui/shared/components';
import { useCaseStudy, useUpdateCaseStudy } from './hooks/useCaseStudies';
import { useAuthStore } from 'ui/shared/hooks/useAuthStore';
import { CaseStudy, CaseStudyPhase, CaseStudyMetric } from 'shared/types';
import { DiagramViewer, CodeComparisonViewer } from './components';
import { CaseStudyEditor } from './views/CaseStudyEditor';
import styles from './case-studies.module.scss';

interface PhasesTimelineProps {
  phases: CaseStudyPhase[];
}

function PhasesTimeline({ phases }: PhasesTimelineProps) {
  return (
    <div className={styles.phaseTimeline}>
      {phases.map((phase, index) => (
        <div key={phase.name} className={styles.phase}>
          <div className={styles.phaseMarker}>
            <div className={styles.phaseDot} />
            {index < phases.length - 1 && <div className={styles.phaseLine} />}
          </div>
          <div className={styles.phaseContent}>
            <h4 className={styles.phaseName}>{phase.name}</h4>
            <p className={styles.phaseDescription}>{phase.description}</p>
            {phase.duration && (
              <span className={styles.phaseDuration}>{phase.duration}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface MetricsGridProps {
  metrics: CaseStudyMetric[];
}

function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className={styles.metricsGrid}>
      {metrics.map((metric) => (
        <div key={metric.label} className={styles.metricCard}>
          <div className={styles.metricLabel}>{metric.label}</div>
          <div className={styles.metricValues}>
            {metric.before && (
              <>
                <span className={styles.metricBefore}>{metric.before}</span>
                <span className={styles.metricArrow}>→</span>
              </>
            )}
            <span className={styles.metricAfter}>{metric.after}</span>
          </div>
          {metric.description && (
            <div className={styles.metricDescription}>{metric.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}

interface CaseStudyDetailProps {
  caseStudy: CaseStudy;
  isAuthenticated: boolean;
  onEdit: () => void;
}

function CaseStudyDetail({
  caseStudy,
  isAuthenticated,
  onEdit,
}: CaseStudyDetailProps) {
  const project = caseStudy.project;

  return (
    <div className={styles.detail}>
      <div className={styles.navLinks}>
        <Link to="/case-studies" className={styles.backLink}>
          ← Back to Case Studies
        </Link>
        <Link to="/projects" className={styles.projectLink}>
          View Projects →
        </Link>
      </div>

      <header className={styles.detailHeader}>
        <h1 className={styles.detailTitle}>{project?.title}</h1>
        <p className={styles.detailRole}>{project?.role}</p>
        <div className={styles.technologies}>
          {project?.technologies.map((tech) => (
            <Badge key={tech} variant="primary">
              {tech}
            </Badge>
          ))}
        </div>
        {isAuthenticated && (
          <div className={styles.detailActions}>
            <Button variant="secondary" onClick={onEdit}>
              Edit Case Study
            </Button>
          </div>
        )}
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>The Problem</h2>
        <div className={styles.markdownContent}>
          <MarkdownContent content={caseStudy.problemContext} />
        </div>
        {caseStudy.challenges.length > 0 && (
          <>
            <h3>Key Challenges</h3>
            <ul className={styles.challengesList}>
              {caseStudy.challenges.map((challenge, i) => (
                <li key={i} className={styles.challengeItem}>
                  {challenge}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>The Solution</h2>
        <div className={styles.markdownContent}>
          <MarkdownContent content={caseStudy.approach} />
        </div>

        {caseStudy.phases.length > 0 && (
          <>
            <h3>Implementation Phases</h3>
            <PhasesTimeline phases={caseStudy.phases} />
          </>
        )}

        {caseStudy.keyDecisions.length > 0 && (
          <>
            <h3>Key Decisions</h3>
            <ul className={styles.decisionsList}>
              {caseStudy.keyDecisions.map((decision, i) => (
                <li key={i} className={styles.decisionItem}>
                  {decision}
                </li>
              ))}
            </ul>
          </>
        )}

        {caseStudy.diagrams && caseStudy.diagrams.length > 0 && (
          <>
            <h3>Architecture Diagrams</h3>
            <DiagramViewer diagrams={caseStudy.diagrams} />
          </>
        )}

        {caseStudy.codeComparisons && caseStudy.codeComparisons.length > 0 && (
          <>
            <h3>Code Evolution</h3>
            <CodeComparisonViewer comparisons={caseStudy.codeComparisons} />
          </>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>The Outcome</h2>
        <div className={styles.markdownContent}>
          <MarkdownContent content={caseStudy.outcomeSummary} />
        </div>

        {caseStudy.metrics.length > 0 && (
          <>
            <h3>Impact Metrics</h3>
            <MetricsGrid metrics={caseStudy.metrics} />
          </>
        )}

        {caseStudy.learnings.length > 0 && (
          <>
            <h3>Key Learnings</h3>
            <ul className={styles.learningsList}>
              {caseStudy.learnings.map((learning, i) => (
                <li key={i} className={styles.learningItem}>
                  {learning}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

export default function CaseStudyDetailContainer() {
  const { slug } = useParams({ from: '/case-studies/$slug' });
  const { data, isLoading, isError, error, refetch } = useCaseStudy(slug);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isEditing, setIsEditing] = useState(false);
  const updateCaseStudy = useUpdateCaseStudy();

  const handleSave = async (updatedData: Partial<CaseStudy>) => {
    if (!data?.id) return;
    await updateCaseStudy.mutateAsync({ id: data.id, data: updatedData });
    setIsEditing(false);
  };

  return (
    <Frame id="case-study-detail">
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        data={data}
        refetch={refetch}
        isEmpty={() => false}
      >
        {(caseStudy) =>
          isEditing ? (
            <CaseStudyEditor
              caseStudy={caseStudy}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <CaseStudyDetail
              caseStudy={caseStudy}
              isAuthenticated={isAuthenticated}
              onEdit={() => setIsEditing(true)}
            />
          )
        }
      </QueryState>
    </Frame>
  );
}
