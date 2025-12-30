import React, { useRef, useEffect, useState } from 'react';
import styles from './ExperiencePage.module.scss';
import { useExperiences } from '../hooks/useExperience';
import ExperienceSection from './ExperienceSection';
import { QueryState } from 'ui/shared/components/QueryState/QueryState';

const ExperiencePage: React.FC = () => {
  const { experiences, isLoading, isError, error, refetch } = useExperiences();
  const containerRef = useRef<HTMLElement>(null);
  const sectionRefs = useRef<HTMLElement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // set up IntersectionObserver to update currentIndex
  useEffect(() => {
    if (!experiences?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx)) setCurrentIndex(idx);
          }
        });
      },
      { threshold: 0.5 },
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [experiences]);

  const scrollToSection = (idx: number) => {
    const section = sectionRefs.current[idx];
    if (section && containerRef.current) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      data={experiences}
      error={error}
      refetch={refetch}
      loadingComponent={
        <div className={styles.status}>Loading experiences...</div>
      }
    >
      {(data) => (
        <main className={styles.container} ref={containerRef}>
          {data.map((entry, idx) => (
            <ExperienceSection
              key={entry.id}
              entry={entry}
              index={idx}
              ref={(el: HTMLElement) => {
                sectionRefs.current[idx] = el;
              }}
            />
          ))}

          <div className={styles.progressDots}>
            {data.map((_, idx) => (
              <div
                key={idx}
                className={`${styles.dot} ${currentIndex === idx ? styles.active : ''}`}
                onClick={() => scrollToSection(idx)}
                role="button"
                tabIndex={0}
                aria-label={`Go to section ${idx + 1}`}
                aria-current={currentIndex === idx ? 'true' : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    scrollToSection(idx);
                  }
                }}
              />
            ))}
          </div>
        </main>
      )}
    </QueryState>
  );
};

export default ExperiencePage;
