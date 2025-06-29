import React from 'react';
import styles from './layout.module.scss';

/**
 * SectionProps defines the props for the Section component.
 * @property {React.ReactNode} children - The content of the section.
 */
interface SectionProps {
  children: React.ReactNode;
}

/**
 * Section component renders a semantic <section> tag with provided content and style.
 * @param {SectionProps} props - The props for the component.
 * @returns {JSX.Element} The rendered section element.
 */
const Section: React.FC<SectionProps> = ({ children }) => {
  return <section className={styles.section}>{children}</section>;
};

export default Section;
