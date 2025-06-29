import React from 'react';
import styles from './layout.module.scss';

/**
 * ParagraphProps defines the props for the Paragraph component.
 * @property {React.ReactNode} children - The content of the paragraph.
 */
interface ParagraphProps {
  children: React.ReactNode;
}

/**
 * Paragraph component renders a semantic <p> tag with provided content and style.
 * @param {ParagraphProps} props - The props for the component.
 * @returns {JSX.Element} The rendered paragraph element.
 */
const Paragraph: React.FC<ParagraphProps> = ({ children }) => {
  return <p className={styles.paragraph}>{children}</p>;
};

export default Paragraph;
