import React, { useRef, useLayoutEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useExperiences } from './useExperience';
import TimelineNode from './TimelineNode';
import styles from './ExperienceTimeline.module.scss';
import TimelineCard from './TimelineCard';

export const ExperienceTimeline: React.FC = () => {
  const { experiences, isLoading, isError } = useExperiences();
  const containerRef = useRef<HTMLDivElement>(null);
  const [constraints, setConstraints] = useState({ left: 0, right: 0 });
  const [openId, setOpenId] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current && experiences?.length) {
      const { scrollWidth, offsetWidth } = containerRef.current;
      setConstraints({ left: -(scrollWidth - offsetWidth), right: 0 });
    }
  }, [experiences]);

  if (isLoading) return <div>Loading timeline…</div>;
  if (isError || !experiences) return <div>Error loading timeline.</div>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.scrollWrapper}>
        <motion.div
          ref={containerRef}
          className={styles.timeline}
          drag="x"
          dragConstraints={constraints}
          dragElastic={0.2}
        >
          {experiences.map((experience) => (
            <div key={experience.id} className={styles.entryWrapper}>
              <TimelineNode
                entry={experience}
                onClick={() =>
                  setOpenId((prev) =>
                    prev === experience.id ? null : experience.id,
                  )
                }
              />
              <TimelineCard
                entry={experience}
                isOpen={openId === experience.id}
                onClose={() => setOpenId(null)}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
