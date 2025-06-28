import React from 'react';
import sections, { SectionType } from './sections';
import styles from './navigation.module.scss';
import Header from './header';
import Section from './section';

interface NavigationProps {
  onNavigation: (component: React.ReactNode) => void;
}

const Navigation: React.FC<NavigationProps> = ({ onNavigation }) => {
  const [activeSection, setActiveSection] = React.useState<string>('About');

  const handleSectionClick = (name: string, component: React.ReactNode) => {
    setActiveSection(name);
    onNavigation(component);
  };

  return (
    <div className={styles.navigation}>
      <Header />
      {Object.values(sections).map((section: SectionType) => (
        <Section
          Component={<section.component />}
          name={section.name}
          active={activeSection === section.name}
          onClick={() =>
            handleSectionClick(section.name, <section.component />)
          }
          key={section.name}
        />
      ))}
    </div>
  );
};

export default Navigation;
