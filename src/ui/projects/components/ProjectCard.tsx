import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Project } from 'shared/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from 'ui/shared/components';
import styles from '../projects.module.scss';
import { useDateFormatter } from 'ui/shared/hooks/useDateFormatter';

interface ProjectCardProps {
  project: Project;
  index: number;
}

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
  const { formatMonthYear } = useDateFormatter();

  const projectStartDate = useMemo(() => {
    return formatMonthYear(project.startDate);
  }, [formatMonthYear, project.startDate]);

  const projectEndDate = useMemo(() => {
    return project?.endDate ? formatMonthYear(project.endDate) : 'Present';
  }, [formatMonthYear, project.endDate]);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      variants={variants}
    >
      <Card className={styles.projectCard}>
        <CardHeader>
          <div className={styles.header}>
            <div className={styles.titleGroup}>
              <CardTitle>{project.title}</CardTitle>
              <span className={styles.role}>{project.role}</span>
            </div>
          </div>
          <div className={styles.meta}>
            <div className={styles.dateGroup}>
              <Calendar size={14} />
              <span>
                {projectStartDate} - {projectEndDate}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className={styles.content}>
          <p className={styles.description}>{project.shortDescription}</p>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Requirements</h4>
            <ul className={styles.requirementsList}>
              {project.requirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Execution</h4>
            {project.execution.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Results</h4>
            {project.results.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Technologies</h4>
            <div className={styles.technologies}>
              {project.technologies.map((tech) => (
                <Badge
                  key={tech}
                  variant="primary"
                  className={styles.techBadge}
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProjectCard;
