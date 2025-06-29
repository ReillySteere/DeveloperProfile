import React from 'react';
import styles from './layout.module.scss';

/**
 * HeadingProps defines the props for the Heading component.
 * @property {string} content - The text content of the heading.
 * @property {"h1" | "h2" | "h3" | "h4" | "h5"} Tag - The heading level to render (h1-h5).
 */
interface HeadingProps {
  children: string;
  Tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5';
}

/**
 * Heading component renders a semantic heading (h1-h5) with provided content and style.
 * @param {HeadingProps} props - The props for the component.
 * @returns {JSX.Element} The rendered heading element.
 */
const Heading: React.FC<HeadingProps> = ({ Tag, children }) => {
  return <Tag className={styles.heading}>{children}</Tag>;
};

export default Heading;
