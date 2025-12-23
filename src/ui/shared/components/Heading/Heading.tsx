import React from 'react';

/**
 * HeadingProps defines the props for the Heading component.
 * @property {string} content - The text content of the heading.
 * @property {"h1" | "h2" | "h3" | "h4" | "h5"} Tag - The heading level to render (h1-h5).
 */
type HeadingProps = {
  children: string;
  Tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5';
} & React.HTMLAttributes<HTMLHeadingElement>;

/**
 * Heading component renders a semantic heading (h1-h5) with provided content and style.
 * @param {HeadingProps} props - The props for the component.
 * @returns {JSX.Element} The rendered heading element.
 */
const Heading: React.FC<HeadingProps> = ({ Tag, children, ...props }) => {
  return <Tag {...props}>{children}</Tag>;
};

export default Heading;
