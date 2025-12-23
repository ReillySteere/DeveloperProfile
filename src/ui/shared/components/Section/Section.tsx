import React from 'react';

/**
 * SectionProps defines the props for the Section component.
 * @property {React.ReactNode} children - The content of the section.
 */
interface SectionProps extends React.HTMLProps<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Section component renders a semantic <section> tag with provided content and style.
 * @param {SectionProps} props - The props for the component.
 * @returns {JSX.Element} The rendered section element.
 */
const Section: React.FC<SectionProps> = ({ children, ...props }) => {
  return <section {...props}>{children}</section>;
};

export default Section;
