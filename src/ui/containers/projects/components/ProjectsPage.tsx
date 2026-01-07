import React from 'react';
import { QueryState } from 'ui/shared/components';
import { useProjects } from '../hooks/useProjects';
import ProjectCard from './ProjectCard';
import styles from '../projects.module.scss';

const ProjectsPage: React.FC = () => {
  const { projects, isLoading, isError, error, refetch } = useProjects();

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
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      )}
    </QueryState>
  );
};

export default ProjectsPage;
