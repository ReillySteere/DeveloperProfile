import React from 'react';
import { motion } from 'framer-motion';
import styles from './TimelineNode.module.scss';
import { ExperienceEntry } from 'shared/types';

interface TimelineNodeProps {
  entry: ExperienceEntry;
  onClick?: () => void;
}

const TimelineNode: React.FC<TimelineNodeProps> = ({ entry, onClick }) => {
  const year = new Date(entry.startDate).getFullYear();

  return (
    <motion.div
      className={styles.node}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${entry.title}, ${year}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className={styles.circle} />
      <div className={styles.label}>{year}</div>
    </motion.div>
  );
};

export default React.memo(TimelineNode);
