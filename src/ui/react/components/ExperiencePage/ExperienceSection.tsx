import React, { forwardRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import styles from './ExperienceSection.module.scss';
import { Heading, List, ListItem, Paragraph } from '../layout';
import { type ExperienceEntry } from 'shared/types';

interface ExperienceSectionProps {
  entry: ExperienceEntry;
  index: number;
}

const variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
};

const ExperienceSection = forwardRef<HTMLElement, ExperienceSectionProps>(
  ({ entry, index }, ref) => {
    const controls = useAnimation();
    const [inViewRef, inView] = useInView({
      threshold: 0.5,
      triggerOnce: false,
    });

    const setRefs = (el: HTMLElement) => {
      inViewRef(el);
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLElement>).current = el;
    };

    const startYear = new Date(entry.startDate).getFullYear();
    const endYear = entry.endDate
      ? new Date(entry.endDate).getFullYear()
      : 'Present';

    useEffect(() => {
      controls.start(inView ? 'visible' : 'hidden');
    }, [controls, inView]);

    return (
      <motion.section
        ref={setRefs}
        data-index={index}
        className={styles.section}
        initial="hidden"
        animate={controls}
        variants={variants}
        transition={{ duration: 0.6 }}
      >
        <Heading Tag="h2" className={styles.title}>
          {entry.role}
        </Heading>
        <Heading Tag="h2" className={styles.title}>
          {entry.company}
        </Heading>
        <Paragraph className={styles.dates}>{entry.description}</Paragraph>
        <Paragraph className={styles.dates}>
          {startYear} – {endYear}
        </Paragraph>
        <List className={styles.bullets} ordered={false}>
          {entry.bulletPoints.map((pt, i) => (
            <ListItem className={styles.bullet} key={i}>
              {pt}
            </ListItem>
          ))}
        </List>
      </motion.section>
    );
  },
);

export default React.memo(ExperienceSection);
