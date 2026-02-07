import React, { useMemo } from 'react';
import { QueryState } from 'ui/shared/components';
import { useProjects } from '../hooks/useProjects';
import { useCaseStudies } from 'ui/containers/case-studies/hooks/useCaseStudies';
import ProjectCard from './ProjectCard';
import styles from '../projects.module.scss';

const ProjectsPage: React.FC = () => {
  const { projects, isLoading, isError, error, refetch } = useProjects();
  const { data: caseStudies } = useCaseStudies();

  // Create a lookup map of projectId -> case study slug
  const caseStudyMap = useMemo(() => {
    if (!caseStudies) return new Map<string, string>();
    return new Map(caseStudies.map((cs) => [cs.projectId, cs.slug]));
  }, [caseStudies]);

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      data={projects}
      error={error}
      refetch={refetch}
    >
      {(data) => (
        <div className={styles.container}>
          {data.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              caseStudySlug={caseStudyMap.get(project.id)}
            />
          ))}
        </div>
      )}
    </QueryState>
  );
};

export default ProjectsPage;
