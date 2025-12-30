import React, { forwardRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Calendar } from 'lucide-react';
import styles from '../experience.module.scss';
import { type ExperienceEntry } from 'shared/types';
import { Badge, Card, CardContent } from '../../shared/components';

interface ExperienceSectionProps {
  entry: ExperienceEntry;
  index: number;
}

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const ExperienceSection = forwardRef<HTMLElement, ExperienceSectionProps>(
  ({ entry, index }, ref) => {
    const controls = useAnimation();
    const [inViewRef, inView] = useInView({
      threshold: 0.2,
      triggerOnce: true,
    });

    const setRefs = (el: HTMLElement) => {
      inViewRef(el);
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLElement>).current = el;
    };

    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return 'Present';
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    };

    useEffect(() => {
      if (inView) {
        controls.start('visible');
      }
    }, [controls, inView]);

    return (
      <motion.section
        ref={setRefs}
        data-index={index}
        className={styles.section}
        initial="hidden"
        animate={controls}
        variants={variants}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Card className={styles.card}>
          <CardContent>
            <div className={styles.header}>
              <h2 className={styles.role}>{entry.role}</h2>
              <div className={styles.company}>
                <span>{entry.company}</span>
              </div>
              <div className={styles.dates}>
                <Calendar size={16} />
                <span>
                  {formatDate(entry.startDate)} – {formatDate(entry.endDate)}
                </span>
              </div>
            </div>

            <p className={styles.description}>{entry.description}</p>

            <div className={styles.list}>
              {entry.bulletPoints.map((pt, i) => (
                <div className={styles.listItem} key={i}>
                  {pt}
                </div>
              ))}
            </div>

            {entry.tags && entry.tags.length > 0 && (
              <div className={styles.tags}>
                {entry.tags.map((tag) => (
                  <Badge key={tag} variant="primary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>
    );
  },
);

export default React.memo(ExperienceSection);
