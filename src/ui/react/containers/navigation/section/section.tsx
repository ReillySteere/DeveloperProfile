import React from 'react';
import styles from './section.module.scss';

interface SectionProps {
  active?: boolean;
  name: string;
  Component: React.ReactNode;
  onClick: (component: React.ReactNode) => void;
}

const Section: React.FC<SectionProps> = ({
  active = false,
  name,
  Component,
  onClick,
}) => {
  const sectionClass = [
    styles.section,
    active ? styles.active : styles.inactive,
  ].join(' ');

  return (
    <div
      className={sectionClass}
      onClick={() => onClick(Component)}
      role="button"
      tabIndex={0}
    >
      <span>{name}</span>
    </div>
  );
};

export default Section;
