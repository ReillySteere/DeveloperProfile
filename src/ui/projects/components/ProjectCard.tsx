import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Link as LinkIcon } from 'lucide-react';
import { Project } from 'shared/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from 'ui/shared/components';
import styles from '../projects.module.scss';

interface ProjectCardProps {
  project: Project;
  index: number;
}

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Present';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

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
            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">
                  <LinkIcon size={16} style={{ marginRight: '0.5rem' }} />
                  View Project
                </Button>
              </a>
            )}
          </div>
          <div className={styles.meta}>
            <div className={styles.dateGroup}>
              <Calendar size={14} />
              <span>
                {formatDate(project.startDate)} - {formatDate(project.endDate)}
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
            <h4 className={styles.sectionTitle}>Execution & Role</h4>
            <p>{project.execution}</p>
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
