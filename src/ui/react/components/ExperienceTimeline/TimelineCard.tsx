import React from 'react';
import { createPortal } from 'react-dom';
import { motion, Variants } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './TimelineCard.module.scss';
import { ExperienceEntry } from 'shared/types';

interface TimelineCardProps {
  entry: ExperienceEntry;
  isOpen: boolean;
  onClose: () => void;
}

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const TimelineCard: React.FC<TimelineCardProps> = ({
  entry,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const startYear = new Date(entry.startDate).getFullYear();
  const endYear = entry.endDate
    ? new Date(entry.endDate).getFullYear()
    : 'Present';

  const card = (
    <motion.div
      className={styles.backdrop}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      onClick={onClose}
    >
      <motion.div
        className={styles.card}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={cardVariants}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${entry.title} details`}
      >
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close details"
        >
          <X size={20} />
        </button>

        <h2 className={styles.title}>{entry.title}</h2>
        <p className={styles.dates}>
          {startYear} – {endYear}
        </p>
        <ul className={styles.bullets}>
          {entry.bulletPoints.map((pt, i) => (
            <li key={i}>{pt}</li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );

  return createPortal(card, document.body);
};

export default TimelineCard;
