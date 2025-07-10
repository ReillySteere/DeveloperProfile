import React, { useRef, useEffect, useState } from 'react';
import styles from './ExperiencePage.module.scss';
import { useExperiences } from './useExperience';
import ExperienceSection from './ExperienceSection';

const ExperiencePage: React.FC = () => {
  const { experiences, isLoading, isError } = useExperiences();
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

  if (isLoading) return <div className={styles.status}>Loading…</div>;
  if (isError || !experiences)
    return <div className={styles.status}>Error loading experiences.</div>;

  return (
    <main className={styles.container} ref={containerRef}>
      {experiences.map((entry, idx) => (
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
        {experiences.map((_, idx) => (
          <div
            key={idx}
            className={`${styles.dot} ${currentIndex === idx ? styles.active : ''}`}
            onClick={() => scrollToSection(idx)}
            role="button"
            tabIndex={0}
            aria-label={`Go to section ${idx + 1}`}
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
  );
};

export default ExperiencePage;
