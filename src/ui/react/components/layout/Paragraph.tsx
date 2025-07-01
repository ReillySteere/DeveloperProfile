import React from 'react';

/**
 * ParagraphProps defines the props for the Paragraph component.
 * @property {React.ReactNode} children - The content of the paragraph.
 */
type ParagraphProps = {
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLParagraphElement>;

/**
 * Paragraph component renders a semantic <p> tag with provided content and style.
 * @param {ParagraphProps} props - The props for the component.
 * @returns {JSX.Element} The rendered paragraph element.
 */
const Paragraph: React.FC<ParagraphProps> = ({ children, ...props }) => {
  return <p {...props}>{children}</p>;
};

export default Paragraph;
